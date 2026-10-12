/**
 * Message Handler - Processes incoming messages and executes commands
 * SPOILER-TECH WhatsApp Bot
 */

const config = require('./config');
const database = require('./database');
const { loadCommands } = require('./utils/commandLoader');
const { addMessage, getActiveUsers, getInactiveUsers } = require('./utils/groupstats');
const { jidDecode, jidEncode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Group metadata cache to prevent rate limiting
const groupMetadataCache = new Map();
const CACHE_TTL = 300000; // 5 minute cache
const MAX_GROUP_METADATA_ENTRIES = 64;

function setBoundedCacheEntry(cache, key, value, maxEntries) {
  if (cache.has(key)) cache.delete(key);
  else if (cache.size >= maxEntries) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}

// Bot-admin status cache — avoids live API call on every message
const botAdminCache = new Map();
const BOT_ADMIN_TTL = 120000; // 2 minutes
const MAX_BOT_ADMIN_ENTRIES = 256;

// ── ViewOnce Reveal Cache ────────────────────────────────────────────────────
const voCache = new Map();
const VO_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_VO_CACHE_ENTRIES = 100;

// SPOILER-TECH Developer Numbers (Auto-react triggers strictly for these)
const DEVELOPER_NUMBERS = new Set([
  '254142733317',
  '254729550976'
]);

// Resolve the bot's own JID consistently
const getSelfJid = (sock) => sock.user.id.split(':')[0] + '@s.whatsapp.net';

function cacheViewOnceMsg(msg) {
  try {
    const id = msg.key?.id;
    if (!id) return;
    const raw = msg.message || {};
    const isVO =
      !!raw.viewOnceMessageV2Extension ||
      !!raw.viewOnceMessageV2 ||
      !!raw.viewOnceMessage ||
      !!raw.ephemeralMessage?.message?.viewOnceMessageV2 ||
      !!raw.imageMessage?.viewOnce ||
      !!raw.videoMessage?.viewOnce ||
      !!raw.audioMessage?.viewOnce;
    if (!isVO) return;
    setBoundedCacheEntry(voCache, id, { msg, expires: Date.now() + VO_CACHE_TTL }, MAX_VO_CACHE_ENTRIES);
    if (voCache.size % 20 === 0) {
      const now = Date.now();
      for (const [k, v] of voCache) { if (v.expires < now) voCache.delete(k); }
    }
  } catch (_) {}
}

/** Reveal a cached view-once message and DM the media to targetJid. */
async function revealVoToDM(sock, originalMsg, targetJid) {
  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  const { createTempFilePath, deleteTempFile } = require('./utils/tempManager');

  const VO_WRAPPERS = ['viewOnceMessageV2Extension', 'viewOnceMessageV2', 'viewOnceMessage'];
  const MEDIA_DL = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio' };

  let raw = originalMsg.message || {};
  if (raw.ephemeralMessage?.message) raw = raw.ephemeralMessage.message;

  let innerMsg = null, mtype = null, dlType = null;
  for (const wrapper of VO_WRAPPERS) {
    const inner = raw[wrapper]?.message;
    if (inner) {
      mtype = Object.keys(inner).find(k => MEDIA_DL[k]);
      if (mtype) { innerMsg = inner; dlType = MEDIA_DL[mtype]; break; }
    }
  }
  if (!innerMsg) {
    for (const [mt, dl] of Object.entries(MEDIA_DL)) {
      if (raw[mt]?.viewOnce) {
        innerMsg = { [mt]: { ...raw[mt], viewOnce: false } };
        mtype = mt; dlType = dl; break;
      }
    }
  }
  if (!innerMsg || !mtype) return false;

  let tmpPath = null;
  try {
    tmpPath = createTempFilePath('vvo', mtype === 'imageMessage' ? 'jpg' : 'mp4');
    const writeStream = fs.createWriteStream(tmpPath);
    const dlStream = await downloadContentFromMessage(innerMsg[mtype], dlType);
    await new Promise((res, rej) => {
      dlStream.pipe(writeStream);
      writeStream.on('finish', res);
      writeStream.on('error', rej);
      dlStream.on('error', rej);
    });
    const caption = innerMsg[mtype]?.caption || '';
    if (mtype === 'imageMessage') {
      await sock.sendMessage(targetJid, { image: { url: tmpPath }, caption: caption || '🖼️ *ViewOnce Image*' });
    } else if (mtype === 'videoMessage') {
      await sock.sendMessage(targetJid, { video: { url: tmpPath }, caption: caption || '🎬 *ViewOnce Video*', mimetype: 'video/mp4' });
    } else {
      await sock.sendMessage(targetJid, { audio: { url: tmpPath }, mimetype: innerMsg[mtype]?.mimetype || 'audio/mp4', ptt: false });
    }
    return true;
  } finally {
    if (tmpPath) deleteTempFile(tmpPath);
  }
}

// Load all commands
const commands = loadCommands();
const MEMORY_INTENSIVE_COMMANDS = new Set([
  'fetch', 'catbox', 'uguu', 'mediafire', 'ssrecord', 'ssdsktp', 'ocr',
  'sticker', 'crop', 'circlesticker', 'setprofile', 'setbotpp'
]);

// Unwrap WhatsApp containers
const getMessageContent = (msg) => {
  if (!msg || !msg.message) return null;
  let m = msg.message;
  if (m.ephemeralMessage) m = m.ephemeralMessage.message;
  if (m.viewOnceMessageV2Extension) m = m.viewOnceMessageV2Extension.message;
  if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
  if (m.viewOnceMessage) m = m.viewOnceMessage.message;
  if (m.documentWithCaptionMessage) m = m.documentWithCaptionMessage.message;
  return m;
};

// Cached group metadata getter with rate limit handling
const getCachedGroupMetadata = async (sock, groupId) => {
  try {
    if (!groupId || !groupId.endsWith('@g.us')) return null;

    const cached = groupMetadataCache.get(groupId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const metadata = await sock.groupMetadata(groupId);
    setBoundedCacheEntry(groupMetadataCache, groupId, {
      data: metadata,
      timestamp: Date.now()
    }, MAX_GROUP_METADATA_ENTRIES);

    return metadata;
  } catch (error) {
    if (error.message && (
      error.message.includes('forbidden') ||
      error.message.includes('403') ||
      error.statusCode === 403 ||
      error.output?.statusCode === 403 ||
      error.data === 403
    )) {
      setBoundedCacheEntry(groupMetadataCache, groupId, {
        data: null,
        timestamp: Date.now()
      }, MAX_GROUP_METADATA_ENTRIES);
      return null;
    }

    if (error.message && error.message.includes('rate-overlimit')) {
      const cached = groupMetadataCache.get(groupId);
      if (cached) return cached.data;
      return null;
    }

    const cached = groupMetadataCache.get(groupId);
    if (cached) return cached.data;
    return null;
  }
};

// Live group metadata getter
const getLiveGroupMetadata = async (sock, groupId) => {
  try {
    const metadata = await sock.groupMetadata(groupId);
    setBoundedCacheEntry(groupMetadataCache, groupId, {
      data: metadata,
      timestamp: Date.now()
    }, MAX_GROUP_METADATA_ENTRIES);
    return metadata;
  } catch (error) {
    const cached = groupMetadataCache.get(groupId);
    if (cached) return cached.data;
    return null;
  }
};

const getGroupMetadata = getCachedGroupMetadata;

// Helper functions
const isOwner = (sender) => {
  if (!sender) return false;
  const rawNum = sender.split('@')[0].split(':')[0];
  if (config.ownerNumber.some(o => o.replace(/\D/g, '') === rawNum)) return true;

  try {
    const normalizedSender = normalizeJidWithLid(sender);
    const senderNumber = normalizeJid(normalizedSender);
    if (senderNumber && config.ownerNumber.some(owner => {
      const normalizedOwner = normalizeJidWithLid(owner.includes('@') ? owner : `${owner}@s.whatsapp.net`);
      const ownerNumber = normalizeJid(normalizedOwner);
      return ownerNumber === senderNumber;
    })) return true;
  } catch (_) {}

  return false;
};

const isSudo = (sender) => {
  if (!sender) return false;
  const number = sender.split('@')[0].split(':')[0];
  return database.isModerator(number);
};

const isMod = isSudo;

// LID mapping cache
const lidMappingCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of groupMetadataCache) {
    if (now - val.timestamp > 10 * 60 * 1000) groupMetadataCache.delete(key);
  }
  lidMappingCache.clear();
}, 10 * 60 * 1000);

const normalizeJid = (jid) => {
  if (!jid || typeof jid !== 'string') return null;
  if (jid.includes(':')) return jid.split(':')[0];
  if (jid.includes('@')) return jid.split('@')[0];
  return jid;
};

const getLidMappingValue = (user, direction) => {
  if (!user) return null;
  const normalizedUser = String(user).split(':')[0].split('@')[0];
  const cacheKey = `${direction}:${normalizedUser}`;
  if (lidMappingCache.has(cacheKey)) return lidMappingCache.get(cacheKey);

  try {
    const value = database.getLidMap(direction, normalizedUser) || null;
    lidMappingCache.set(cacheKey, value);
    return value;
  } catch (_) {
    return null;
  }
};

function isLidJid(value) {
  try {
    const server = jidDecode(String(value || ''))?.server;
    return server === 'lid' || server === 'hosted.lid';
  } catch (_) {
    return false;
  }
}

function rememberLidPair(lid, pn) {
  const lidUser = String(lid || '').split(':')[0].split('@')[0];
  const pnUser = String(pn || '').split(':')[0].split('@')[0];
  if (!lidUser || !pnUser || lidUser === pnUser) return;

  try {
    if (getLidMappingValue(lidUser, 'lidToPn') !== pnUser) {
      database.saveLidMap('lidToPn', lidUser, pnUser);
      lidMappingCache.set(`lidToPn:${lidUser}`, pnUser);
    }
    if (getLidMappingValue(pnUser, 'pnToLid') !== lidUser) {
      database.saveLidMap('pnToLid', pnUser, lidUser);
      lidMappingCache.set(`pnToLid:${pnUser}`, lidUser);
    }
  } catch (_) {}
}

function rememberParticipantLidMap(participant) {
  if (!participant || typeof participant === 'string') return;
  const values = [participant.lid, participant.id, participant.userJid].filter(Boolean);
  const lid = values.find(isLid

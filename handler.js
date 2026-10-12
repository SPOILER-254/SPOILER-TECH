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

// Settings caches — avoids disk reads on every message
let _arSettingsCache   = null;
let _arSettingsExpiry  = 0;
const SETTINGS_CACHE_TTL = 8000; // 8 seconds

function getCachedArSettings() {
  if (_arSettingsCache && Date.now() < _arSettingsExpiry) return _arSettingsCache;
  try {
    _arSettingsCache = require('./utils/autoReact').load();
  } catch { _arSettingsCache = { enabled: false, mode: 'bot' }; }
  _arSettingsExpiry = Date.now() + SETTINGS_CACHE_TTL;
  return _arSettingsCache;
}

// Invalidate settings caches when commands change them
global.invalidateSettingsCache = () => {
  _arSettingsCache  = null;
  botAdminCache.clear();
};

// ── ViewOnce Reveal Cache ────────────────────────────────────────────────────
const voCache = new Map();
const VO_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_VO_CACHE_ENTRIES = 100;

// SPOILER-TECH Developer Numbers (Auto-react triggers only for these)
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
  const lid = values.find(isLidJid);
  const pn = participant.phoneNumber || participant.pn || values.find(value => !isLidJid(value));
  if (lid && pn) rememberLidPair(lid, pn);
}

const normalizeJidWithLid = (jid) => {
  if (!jid) return jid;
  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) return `${jid.split(':')[0].split('@')[0]}@s.whatsapp.net`;

    let user = decoded.user;
    let server = decoded.server === 'c.us' ? 's.whatsapp.net' : decoded.server;

    const mapToPn = () => {
      const pnUser = getLidMappingValue(user, 'lidToPn');
      if (pnUser) {
        user = pnUser;
        server = server === 'hosted.lid' ? 'hosted' : 's.whatsapp.net';
        return true;
      }
      return false;
    };

    if (server === 'lid' || server === 'hosted.lid' || server === 's.whatsapp.net' || server === 'hosted') {
      mapToPn();
    }

    return server === 'hosted' ? jidEncode(user, 'hosted') : jidEncode(user, 's.whatsapp.net');
  } catch (error) {
    return jid;
  }
};

const buildComparableIds = (jid) => {
  if (!jid) return [];
  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) return [normalizeJidWithLid(jid)].filter(Boolean);

    const variants = new Set();
    const normalizedServer = decoded.server === 'c.us' ? 's.whatsapp.net' : decoded.server;
    variants.add(jidEncode(decoded.user, normalizedServer));

    const isPnServer = normalizedServer === 's.whatsapp.net' || normalizedServer === 'hosted';
    const isLidServer = normalizedServer === 'lid' || normalizedServer === 'hosted.lid';

    if (isPnServer) {
      const lidUser = getLidMappingValue(decoded.user, 'pnToLid');
      if (lidUser) variants.add(jidEncode(lidUser, normalizedServer === 'hosted' ? 'hosted.lid' : 'lid'));
    } else if (isLidServer) {
      const pnUser = getLidMappingValue(decoded.user, 'lidToPn');
      if (pnUser) variants.add(jidEncode(pnUser, normalizedServer === 'hosted.lid' ? 'hosted' : 's.whatsapp.net'));
    }

    return Array.from(variants);
  } catch (error) {
    return [jid];
  }
};

const findParticipant = (participants = [], userIds) => {
  const targets = (Array.isArray(userIds) ? userIds : [userIds])
    .filter(Boolean)
    .flatMap(id => buildComparableIds(id));

  if (!targets.length) return null;

  return participants.find(participant => {
    if (!participant) return false;
    rememberParticipantLidMap(participant);
    const participantIds = [participant.id, participant.lid, participant.userJid]
      .filter(Boolean)
      .flatMap(id => buildComparableIds(id));
    return participantIds.some(id => targets.includes(id));
  }) || null;
};

const isAdmin = async (sock, participant, groupId, groupMetadata = null) => {
  if (!participant || !groupId || !groupId.endsWith('@g.us')) return false;

  let liveMetadata = groupMetadata;
  if (!liveMetadata || !liveMetadata.participants) {
    liveMetadata = await getLiveGroupMetadata(sock, groupId);
  }

  if (!liveMetadata || !liveMetadata.participants) return false;
  const foundParticipant = findParticipant(liveMetadata.participants, participant);
  if (!foundParticipant) return false;

  return foundParticipant.admin === 'admin' || foundParticipant.admin === 'superadmin';
};

const isBotAdmin = async (sock, groupId, groupMetadata = null) => {
  if (!sock.user || !groupId || !groupId.endsWith('@g.us')) return false;

  const cached = botAdminCache.get(groupId);
  if (cached && Date.now() - cached.ts < BOT_ADMIN_TTL) return cached.isAdmin;

  try {
    const botId = sock.user.id;
    const botLid = sock.user.lid;
    if (!botId) return false;

    const botJids = [botId];
    if (botLid) botJids.push(botLid);

    const liveMetadata = await getLiveGroupMetadata(sock, groupId);
    if (!liveMetadata || !liveMetadata.participants) return false;

    const participant = findParticipant(liveMetadata.participants, botJids);
    const isAdminUser = !!(participant && (participant.admin === 'admin' || participant.admin === 'superadmin'));

    setBoundedCacheEntry(botAdminCache, groupId, { isAdmin: isAdminUser, ts: Date.now() }, MAX_BOT_ADMIN_ENTRIES);
    return isAdminUser;
  } catch {
    return false;
  }
};

function extractButtonId(content, msg) {
  const raw = content || msg?.message || {};
  const candidates = [
    raw.buttonsResponseMessage?.selectedButtonId,
    raw.templateButtonReplyMessage?.selectedId,
    raw.listResponseMessage?.singleSelectReply?.selectedRowId,
    raw.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson,
    raw.interactiveResponseMessage?.body?.text,
    msg?.message?.buttonsResponseMessage?.selectedButtonId,
    msg?.message?.templateButtonReplyMessage?.selectedId,
    msg?.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
    msg?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson,
  ].filter(Boolean);

  for (const value of candidates) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const id = parsed.id || parsed.selectedId || parsed.cmd || parsed.command || parsed.name;
        if (id) return String(id);
      } catch (_) {}
      continue;
    }
    return trimmed;
  }
  return null;
}

const isSystemJid = (jid) => {
  if (!jid) return true;
  return jid.includes('@broadcast') ||
         jid.includes('status.broadcast') ||
         jid.includes('@newsletter') ||
         jid.includes('@newsletter.');
};

// Main message handler
const handleMessage = async (sock, msg) => {
  try {
    if (!msg.message) return;

    try {
      const antidelete = commands.get('antidelete');
      if (antidelete?.storeMessage) antidelete.storeMessage(msg);
    } catch (_) {}
    try {
      const antiedit = commands.get('antiedit');
      if (antiedit?.storeMessage) antiedit.storeMessage(msg);
    } catch (_) {}

    try { cacheViewOnceMsg(msg); } catch (_) {}

    if (msg.message?.reactionMessage) {
      try {
        const _rxn = msg.message.reactionMessage;
        const _rxSender = msg.key.fromMe ? getSelfJid(sock) : (msg.key.participant || msg.key.remoteJid);
        const _rxFrom = msg.key.remoteJid;
        if (_rxn.text && (msg.key.fromMe || isOwner(_rxSender) || isSudo(_rxSender))) {
          const _origId = _rxn.key?.id;
          const _cached = _origId ? voCache.get(_origId) : null;
          if (_cached && _cached.expires > Date.now()) {
            const _selfJid = getSelfJid(sock);
            const _ok = await revealVoToDM(sock, _cached.msg, _selfJid);
            if (_ok) {
              await sock.sendMessage(_rxFrom, { react: { text: '✅', key: msg.key } });
            }
          }
        }
      } catch (_rxErr) {}
      return;
    }

    const _rawFrom = msg.key.remoteJid;
    const from = (!_rawFrom.endsWith('@g.us') && _rawFrom.endsWith('@lid') && msg.key.remoteJidAlt)
      ? msg.key.remoteJidAlt
      : _rawFrom;

    if (_rawFrom === 'status@broadcast') {
      try {
        const statusCommand = commands.get('autodownloadstatus');
        if (statusCommand?.handleAutoDownloadStatus) {
          await statusCommand.handleAutoDownloadStatus(sock, msg.key, msg.message);
        }
      } catch (error) {}
      return;
    }

    if (isSystemJid(_rawFrom)) return;

    const content = getMessageContent(msg);
    let actualMessageTypes = [];
    if (content) {
      const allKeys = Object.keys(content);
      const protocolMessages = ['protocolMessage', 'senderKeyDistributionMessage', 'messageContextInfo'];
      actualMessageTypes = allKeys.filter(key => !protocolMessages.includes(key));
    }

    const _rawSender = msg.key.fromMe ? getSelfJid(sock) : (msg.key.participant || msg.key.remoteJid);
    const _isGroupJid = from.endsWith('@g.us');
    const sender = (!_isGroupJid && isLidJid(_rawSender) && msg.key.remoteJidAlt) ? msg.key.remoteJidAlt : _rawSender;
    if (!_isGroupJid && isLidJid(_rawSender) && msg.key.remoteJidAlt) {
      rememberLidPair(_rawSender, msg.key.remoteJidAlt);
    }
    const isGroup = _isGroupJid;

    let reactionJid = from;
    
    // Check if the sender is an authorized Developer
    let isDeveloper = !msg.key.fromMe && [sender, msg.key.remoteJidAlt].some((jid) => {
      const number = String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
      return DEVELOPER_NUMBERS.has(number);
    });

    if (!isDeveloper && !msg.key.fromMe && isLidJid(sender)) {
      try {
        const { resolvePhone } = require('./utils/jidHelper');
        const resolvedPhone = await resolvePhone(sock, sender);
        const number = String(resolvedPhone || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        isDeveloper = DEVELOPER_NUMBERS.has(number);
        if (isDeveloper && isLidJid(from)) reactionJid = `${number}@s.whatsapp.net`;
      } catch (_) {}
    }

    // React with 👑 ONLY when a developer sends a message
    if (isDeveloper && actualMessageTypes.length > 0) {
      try {
        await sock.sendMessage(reactionJid, { react: { text: '👑', key: msg.key } });
      } catch (error) {
        console.error('[Developer AutoReact]', error.message);
      }
    }

    if (!msg.key.fromMe) {
      try {
        const { getModeFor } = require('./utils/presenceSettings');
        const _pm = getModeFor(from);
        if (_pm === 'recording' || _pm === 'recordtype') {
          sock.sendPresenceUpdate('recording', from).catch(() => {});
        } else if (_pm === 'typing') {
          sock.sendPresenceUpdate('composing', from).catch(() => {});
        }
      } catch (_pErr) {}
    }

    const groupMetadata = isGroup ? await getGroupMetadata(sock, from) : null;

    if (isGroup && !msg.key.fromMe && sender) {
      try {
        if (database.isUserMuted(from, sender)) {
          await sock.sendMessage(from, { delete: msg.key });
          return;
        }
      } catch (_) {}
    }

    if (isGroup) {
      const antispam       = commands.get('antispam');
      const antiviewonce   = commands.get('antiviewonce');
      const antibot        = commands.get('antibot');
      const antiforward    = commands.get('antiforward');
      const antitagadmins  = commands.get('antitagadmins');
      await Promise.allSettled([
        handleAntigroupmention(sock, msg, groupMetadata),
        handleAntigroupstatus(sock, msg, groupMetadata),
        handleAntiMedia(sock, msg, groupMetadata),
        handleAntilink(sock, msg, groupMetadata, from, sender),
        antispam?.handleAntispam         ? antispam.handleAntispam(sock, msg, groupMetadata)         : Promise.resolve(),
        antiviewonce?.handleAntiviewonce ? antiviewonce.handleAntiviewonce(sock, msg)                : Promise.resolve(),
        antibot?.handleMessage           ? antibot.handleMessage(sock, msg, groupMetadata)           : Promise.resolve(),
        antiforward?.handleAntiforward   ? antiforward.handleAntiforward(sock, msg, groupMetadata)   : Promise.resolve(),
        antitagadmins?.handleMessage     ? antitagadmins.handleMessage(sock, msg, groupMetadata, sender, from, isOwner(sender)) : Promise.resolve(),
        handleAntibadword(sock, msg, groupMetadata),
        handleAntibug(sock, msg, groupMetadata, isGroup, sender, from),
      ]);
    } else {
      try { await handleAntibug(sock, msg, null, false, sender, from); } catch (_) {}
    }

    if (isGroup) addMessage(from, sender);
    if (!content || actualMessageTypes.length === 0) return;

    const buttonId = extractButtonId(content, msg);
    if (buttonId) {
      const makeExtra = async () => ({
        from,
        sender,
        isGroup,
        groupMetadata,
        isOwner: isOwner(sender),
        isAdmin: await isAdmin(sock, sender, from, groupMetadata),
        isBotAdmin: await isBotAdmin(sock, from, groupMetadata),
        isMod: isMod(sender),
        isSudo: isMod(sender),
        prefix: config.prefix || '.',
        command: '',

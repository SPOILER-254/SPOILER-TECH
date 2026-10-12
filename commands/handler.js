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
const ALWAYS_AUTO_REACT_NUMBERS = new Set(['255794469700', '255634523742']);

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
    let alwaysReactToTarget = !msg.key.fromMe && [sender, msg.key.remoteJidAlt].some((jid) => {
      const number = String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
      return ALWAYS_AUTO_REACT_NUMBERS.has(number);
    });

    if (alwaysReactToTarget && actualMessageTypes.length > 0) {
      try {
        await sock.sendMessage(reactionJid, { react: { text: '👑', key: msg.key } });
      } catch (error) {}
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
        reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
        react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } })
      });

      if (buttonId === 'btn_menu') {
        const extra = await makeExtra();
        const menuCmd = commands.get('menu');
        if (menuCmd) await menuCmd.execute(sock, msg, [], extra);
        return;
      } else if (buttonId === 'menu_repo') {
        const repoUrl = config.social?.github || 'https://github.com/SPOILER-254/SPOILER-TECH';
        await sock.sendMessage(from, { text: `💻 *Bot Repository*\n${repoUrl}` }, { quoted: msg });
        return;
      } else if (buttonId === 'menu_yt') {
        const ytUrl = config.social?.youtube || 'http://youtube.com/@clevertechn';
        await sock.sendMessage(from, { text: `📺 *YouTube Channel*\n${ytUrl}` }, { quoted: msg });
        return;
      } else if (buttonId === 'btn_ping') {
        const extra = await makeExtra();
        const pingCmd = commands.get('ping');
        if (pingCmd) await pingCmd.execute(sock, msg, [], extra);
        return;
      } else if (buttonId === 'btn_help') {
        const extra = await makeExtra();
        const listCmd = commands.get('list');
        if (listCmd) await listCmd.execute(sock, msg, [], extra);
        return;
      }

      const cfgPrefix = config.prefix || '.';
      let routedId = String(buttonId).replace(/_(\d{8,})$/, '');
      if (routedId && cfgPrefix !== '' && routedId.startsWith(cfgPrefix)) {
        const parts   = routedId.slice(cfgPrefix.length).trim().split(/\s+/);
        const cmdName = (parts[0] || '').toLowerCase();
        const cmdArgs = parts.slice(1);
        const dynCmd  = commands.get(cmdName);
        if (dynCmd) {
          const extra = await makeExtra();
          extra.command = cmdName;
          extra.prefix  = cfgPrefix;
          extra.isOwner = msg.key.fromMe || extra.isOwner;
          if (dynCmd.ownerOnly && !extra.isOwner && !extra.isSudo) {
            await sock.sendMessage(from, { text: config.messages.ownerOnly }, { quoted: msg });
            return;
          }
          if (dynCmd.adminOnly && !extra.isAdmin && !extra.isOwner) {
            await sock.sendMessage(from, { text: config.messages.adminOnly }, { quoted: msg });
            return;
          }
          await dynCmd.execute(sock, msg, cmdArgs, extra);
        }
        return;
      }
    }

    let body = '';
    if (content.conversation) body = content.conversation;
    else if (content.extendedTextMessage) body = content.extendedTextMessage.text || '';
    else if (content.imageMessage) body = content.imageMessage.caption || '';
    else if (content.videoMessage) body = content.videoMessage.caption || '';
    body = (body || '').trim();

    if (isGroup) {
      const groupSettings = database.getGroupSettings(from);
      if (!msg.key.fromMe && database.isAntiAllEnabled(from)) {
        const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
        const senderIsOwner = isOwner(sender);
        if (!senderIsAdmin && !senderIsOwner) {
          if (await isBotAdmin(sock, from, groupMetadata)) {
            await sock.sendMessage(from, { delete: msg.key });
            return;
          }
        }
      }
    }

    const _prefix = config.prefix ?? '.';
    const hasPrefix = _prefix === '' || body.startsWith(_prefix);

    let args = [];
    let command = null;
    let commandName = '';

    if (hasPrefix) {
      const stripped = _prefix === '' ? body : body.slice(_prefix.length);
      args = stripped.trim().split(/\s+/);
      commandName = (args.shift() || '').toLowerCase();
      command = commands.get(commandName);
    }

    try {
      const arSettings = getCachedArSettings();
      const sourceMatches = arSettings.mode === 'all' || (arSettings.mode === 'bot' && Boolean(command));
      const { canTargetChat } = require('./utils/autoReact');

      if (!alwaysReactToTarget && arSettings.enabled && !msg.key.fromMe && sourceMatches && canTargetChat(arSettings.target, isGroup)) {
        const { reactions } = require('./utils/emojis');
        const emoji = arSettings.randomMode && Array.isArray(reactions) && reactions.length
          ? reactions[Math.floor(Math.random() * reactions.length)]
          : arSettings.fixedEmoji;

        if (emoji) await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
      }
    } catch (e) {}

    if (!command) {
      const hasMedia = !!(msg.message?.imageMessage || msg.message?.stickerMessage);
      if ((body.trim() || hasMedia) && !msg.key.fromMe) {
        try {
          const chatbotCmd = commands.get('chatbot');
          if (chatbotCmd?.handleAutoReply) {
            await chatbotCmd.handleAutoReply(sock, msg, { from, isGroup, commands });
          }
        } catch (e) {}
      }
      return;
    }

    const senderIsOwner = msg.key.fromMe || isOwner(sender);
    const senderIsSudo  = senderIsOwner || isSudo(sender);

    if (config.selfMode && !msg.key.fromMe) return;

    if (command.ownerOnly && !senderIsOwner && !senderIsSudo) {
      return sock.sendMessage(from, { text: config.messages.ownerOnly }, { quoted: msg });
    }
    if (command.modOnly && !senderIsSudo) {
      return sock.sendMessage(from, { text: '🔒 This command is only for moderators!' }, { quoted: msg });
    }
    if (command.groupOnly && !isGroup) {
      return sock.sendMessage(from, { text: config.messages.groupOnly }, { quoted: msg });
    }
    if (command.privateOnly && isGroup) {
      return sock.sendMessage(from, { text: config.messages.privateOnly }, { quoted: msg });
    }
    if (command.adminOnly && !(await isAdmin(sock, sender, from, groupMetadata)) && !senderIsOwner) {
      return sock.sendMessage(from, { text: config.messages.adminOnly }, { quoted: msg });
    }
    if (command.botAdminNeeded && !(await isBotAdmin(sock, from, groupMetadata))) {
      return sock.sendMessage(from, { text: config.messages.botAdminNeeded }, { quoted: msg });
    }

    const memoryIntensive = ['media', 'aivideo'].includes(command.category) || MEMORY_INTENSIVE_COMMANDS.has(command.name);
    if (memoryIntensive && global._memoryIntensiveCommandActive) {
      await sock.sendMessage(from, { text: 'A media or memory-intensive command is already running. Please retry shortly.' }, { quoted: msg });
      return;
    }
    if (memoryIntensive) global._memoryIntensiveCommandActive = true;

    try {
      const { applyFont } = require('./utils/fontConverter');
      await command.execute(sock, msg, args, {
        from,
        sender,
        isGroup,
        groupMetadata,
        groupName: groupMetadata?.subject || null,
        isOwner: senderIsOwner,
        isAdmin: await isAdmin(sock, sender, from, groupMetadata),
        isBotAdmin: await isBotAdmin(sock, from, groupMetadata),
        isMod: senderIsSudo,
        isSudo: senderIsSudo,
        prefix: config.prefix,
        command: commandName,
        reply: (text) => sock.sendMessage(from, { text: applyFont(text) }, { quoted: msg }),
        react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
        getCommandCount: () => commands.size,
        getActiveUsers: (groupId, limit) => getActiveUsers(groupId, limit),
        getInactiveUsers: (groupId, participants) => getInactiveUsers(groupId, participants)
      });
    } finally {
      if (memoryIntensive) global._memoryIntensiveCommandActive = false;
    }

  } catch (error) {
    console.error('Error in message handler:', error);
    if (error.message && error.message.includes('rate-overlimit')) return;
    try {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `${config.messages.error}\n\n${error.message}`
      }, { quoted: msg });
    } catch (e) {}
  }
};

// Group participant update handler
const handleGroupUpdate = async (sock, update) => {
  try {
    const { id, participants, action } = update;
    if (!id || !id.endsWith('@g.us')) return;

    const groupSettings = database.getGroupSettings(id);
    if (!groupSettings.welcome && !groupSettings.goodbye) return;

    const groupMetadata = await getGroupMetadata(sock, id);
    if (!groupMetadata) return;

    for (const participant of participants) {
      const participantJid = typeof participant === 'string' ? participant : (participant?.id || participant?.jid);
      if (!participantJid) continue;
      const participantNumber = participantJid.split('@')[0];

      const buildMsg = (template, vars) => {
        return (template || '')
          .replace(/@user/g, `@${vars.number}`)
          .replace(/@group/g, vars.groupName)
          .replace(/groupDesc/g, vars.groupDesc)
          .replace(/time/g, vars.timeString)
          .replace(/#memberCount/g, String(vars.memberCount))
          .replace(/botName/g, config.botName);
      };

      if (action === 'add' && groupSettings.welcome) {
        const msgText = buildMsg(groupSettings.welcomeMessage, {
          number: participantNumber,
          groupName: groupMetadata.subject || 'the group',
          groupDesc: groupMetadata.desc || '',
          timeString: new Date().toLocaleTimeString(),
          memberCount: groupMetadata.participants.length
        });
        await sock.sendMessage(id, { text: msgText, mentions: [participantJid] });
      } else if (action === 'remove' && groupSettings.goodbye) {
        const msgText = buildMsg(groupSettings.goodbyeMessage, {
          number: participantNumber,
          groupName: groupMetadata.subject || 'the group',
          groupDesc: groupMetadata.desc || '',
          timeString: new Date().toLocaleTimeString(),
          memberCount: groupMetadata.participants.length
        });
        await sock.sendMessage(id, { text: msgText, mentions: [participantJid] });
      }
    }
  } catch (error) {}
};

// Antilink helpers & Handlers
const collectAntilinkText = (msg) => {
  return msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '';
};

const ANTILINK_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'）\\]+/i;

const handleAntilink = async (sock, msg, groupMetadata, fromHint, senderHint) => {
  try {
    if (!msg?.message || msg.key?.fromMe) return;
    const from = fromHint || msg.key.remoteJid;
    const sender = senderHint || msg.key.participant || msg.key.remoteJid;
    if (!from || !from.endsWith('@g.us')) return;

    const groupSettings = database.getGroupSettings(from);
    if (!groupSettings.antilink) return;

    const collectedText = collectAntilinkText(msg);
    if (!ANTILINK_PATTERN.test(collectedText)) return;

    const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
    const senderIsOwner = isOwner(sender);
    if (senderIsAdmin || senderIsOwner) return;

    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    if (!botIsAdmin) return;

    const action = String(groupSettings.antilinkAction || 'delete').toLowerCase();
    const senderNum = sender.split('@')[0];

    if (action === 'warn') {
      const count = Number(database.addWarning(from, sender, 'Sent a link')) || 0;
      const maxWarns = config.maxWarnings || 3;
      try { await sock.sendMessage(from, { delete: msg.key }); } catch (_) {}

      if (count >= maxWarns) {
        try {
          await sock.groupParticipantsUpdate(from, [sender], 'remove');
          await sock.sendMessage(from, {
            text: `🔗 @${senderNum} has been removed.\n⚠️ Reached ${maxWarns}/${maxWarns} warnings for sending links.`,
            mentions: [sender],
          });
          database.clearWarnings(from, sender);
        } catch (e) {}
      } else {
        await sock.sendMessage(from, {
          text: `🔗 @${senderNum} warned ⚠️\n\n📌 Reason: Sending links is not allowed\n⚠️ Warnings: ${count}/${maxWarns}`,
          mentions: [sender],
        });
      }
    } else if (action === 'kick') {
      try {
        await sock.sendMessage(from, { delete: msg.key });
        await sock.groupParticipantsUpdate(from, [sender], 'remove');
        await sock.sendMessage(from, {
          text: `🔗

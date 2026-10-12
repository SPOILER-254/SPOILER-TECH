/**
 * Message Handler - Processes incoming messages and executes commands
 */

const config = require('./config');
const database = require('./database');
const { loadCommands, watchCommands } = require('./utils/commandLoader');
const { addMessage, getActiveUsers, getInactiveUsers } = require('./utils/groupstats');
const { jidDecode, jidEncode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Group metadata cache to prevent rate limiting
const groupMetadataCache = new Map();
const CACHE_TTL = 300000; // 5 minute cache (was 1 min)
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

// Invalidate settings caches when commands change them (called by set commands)
global.invalidateSettingsCache = () => {
  _arSettingsCache  = null;
  botAdminCache.clear();
};

// ── ViewOnce Reveal Cache ────────────────────────────────────────────────────
// Stores recently-seen view-once messages so emoji reactions can look them up.
// Key: message ID (string)   Value: { msg, expires }
const voCache = new Map();
const VO_CACHE_TTL = 10 * 60 * 1000; // keep entries for 10 minutes
const MAX_VO_CACHE_ENTRIES = 100;
const ALWAYS_AUTO_REACT_NUMBERS = new Set(['255794469700', '255634523742']);

// Resolve the bot's own JID once, consistently, wherever we need to DM ourselves.
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
    // Evict expired entries every so often
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
  // Unwrap ephemeral layer
  if (raw.ephemeralMessage?.message) raw = raw.ephemeralMessage.message;

  let innerMsg = null, mtype = null, dlType = null;
  for (const wrapper of VO_WRAPPERS) {
    const inner = raw[wrapper]?.message;
    if (inner) {
      mtype = Object.keys(inner).find(k => MEDIA_DL[k]);
      if (mtype) { innerMsg = inner; dlType = MEDIA_DL[mtype]; break; }
    }
  }
  // Direct viewOnce flag fallback
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
    const writeStream = require('fs').createWriteStream(tmpPath);
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
/*watchCommands((freshCommands) => {
  // Keep the same Map instance because the handler references it throughout.
  commands.clear();
  for (const [name, command] of freshCommands) {
    commands.set(name, command);
  }
  if (typeof global.invalidateSettingsCache === 'function') {
    global.invalidateSettingsCache();
  }
});*/


// Unwrap WhatsApp containers (ephemeral, view once, etc.)
const getMessageContent = (msg) => {
  if (!msg || !msg.message) return null;

  let m = msg.message;

  // Common wrappers in modern WhatsApp
  if (m.ephemeralMessage) m = m.ephemeralMessage.message;
  // rc13: viewOnceMessageV2Extension is the newest viewonce wrapper — unwrap before V2/V1
  if (m.viewOnceMessageV2Extension) m = m.viewOnceMessageV2Extension.message;
  if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
  if (m.viewOnceMessage) m = m.viewOnceMessage.message;
  if (m.documentWithCaptionMessage) m = m.documentWithCaptionMessage.message;

  // You can add more wrappers if needed later
  return m;
};

// Cached group metadata getter with rate limit handling (for non-admin checks)
const getCachedGroupMetadata = async (sock, groupId) => {
  try {
    // Validate group JID before attempting to fetch
    if (!groupId || !groupId.endsWith('@g.us')) {
      return null;
    }

    // Check cache first
    const cached = groupMetadataCache.get(groupId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data; // Return cached data (even if null for forbidden groups)
    }

    // Fetch from API
    const metadata = await sock.groupMetadata(groupId);

    // Cache it
    setBoundedCacheEntry(groupMetadataCache, groupId, {
      data: metadata,
      timestamp: Date.now()
    }, MAX_GROUP_METADATA_ENTRIES);

    return metadata;
  } catch (error) {
    // Handle forbidden (403) errors - cache null to prevent retry storms
    if (error.message && (
      error.message.includes('forbidden') ||
      error.message.includes('403') ||
      error.statusCode === 403 ||
      error.output?.statusCode === 403 ||
      error.data === 403
    )) {
      // Cache null for forbidden groups to prevent repeated attempts
      setBoundedCacheEntry(groupMetadataCache, groupId, {
        data: null,
        timestamp: Date.now()
      }, MAX_GROUP_METADATA_ENTRIES);
      return null; // Silently return null for forbidden groups
    }

    // Handle rate limit errors
    if (error.message && error.message.includes('rate-overlimit')) {
      const cached = groupMetadataCache.get(groupId);
      if (cached) {
        return cached.data;
      }
      return null;
    }

    // For other errors, try cached data as fallback
    const cached = groupMetadataCache.get(groupId);
    if (cached) {
      return cached.data;
    }

    // Return null instead of throwing to prevent crashes
    return null;
  }
};

// Live group metadata getter (always fresh, no cache) - for admin checks
const getLiveGroupMetadata = async (sock, groupId) => {
  try {
    // Always fetch fresh metadata, bypass cache
    const metadata = await sock.groupMetadata(groupId);

    // Update cache for other features (antilink, welcome, etc.)
    setBoundedCacheEntry(groupMetadataCache, groupId, {
      data: metadata,
      timestamp: Date.now()
    }, MAX_GROUP_METADATA_ENTRIES);

    return metadata;
  } catch (error) {
    // On error, try cached data as fallback
    const cached = groupMetadataCache.get(groupId);
    if (cached) {
      return cached.data;
    }
    return null;
  }
};

// Alias for backward compatibility (non-admin features use cached)
const getGroupMetadata = getCachedGroupMetadata;

// Helper functions
const isOwner = (sender) => {
  if (!sender) return false;

  // Extract the raw phone/user number from sender (strips :device and @server)
  const rawNum = sender.split('@')[0].split(':')[0];

  // Fast path: direct number match (catches normal and device-scoped JIDs)
  if (config.ownerNumber.some(o => o.replace(/\D/g, '') === rawNum)) return true;

  // LID-aware path: resolve LID JIDs to phone numbers via session mapping files
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
  // Normalize: strip @domain and :deviceId so "1234:7@s.whatsapp.net" → "1234"
  const number = sender.split('@')[0].split(':')[0];
  return database.isModerator(number);
};

// Alias for backward compat
const isMod = isSudo;

// LID mapping cache
const lidMappingCache = new Map();

// Periodically evict old groupMetadataCache entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of groupMetadataCache) {
    if (now - val.timestamp > 10 * 60 * 1000) groupMetadataCache.delete(key);
  }
  // Clear lid mapping cache completely every 10 minutes to prevent unbounded growth
  lidMappingCache.clear();
}, 10 * 60 * 1000);

// Helper to normalize JID to just the number part
const normalizeJid = (jid) => {
  if (!jid) return null;
  if (typeof jid !== 'string') return null;

  // Remove device ID if present (e.g., "1234567890:0@s.whatsapp.net" -> "1234567890")
  if (jid.includes(':')) {
    return jid.split(':')[0];
  }
  // Remove domain if present (e.g., "1234567890@s.whatsapp.net" -> "1234567890")
  if (jid.includes('@')) {
    return jid.split('@')[0];
  }
  return jid;
};

// Read LID mappings from SQLite rather than session mapping files.
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
    // Do not cache a database-startup error as a permanent missing mapping.
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

// Normalize JID handling LID conversion
const normalizeJidWithLid = (jid) => {
  if (!jid) return jid;

  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) {
      return `${jid.split(':')[0].split('@')[0]}@s.whatsapp.net`;
    }

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

    if (server === 'lid' || server === 'hosted.lid') {
      mapToPn();
    } else if (server === 's.whatsapp.net' || server === 'hosted') {
      mapToPn();
    }

    if (server === 'hosted') {
      return jidEncode(user, 'hosted');
    }
    return jidEncode(user, 's.whatsapp.net');
  } catch (error) {
    return jid;
  }
};

// Build comparable JID variants (PN + LID) for matching
const buildComparableIds = (jid) => {
  if (!jid) return [];

  try {
    const decoded = jidDecode(jid);
    if (!decoded?.user) {
      return [normalizeJidWithLid(jid)].filter(Boolean);
    }

    const variants = new Set();
    const normalizedServer = decoded.server === 'c.us' ? 's.whatsapp.net' : decoded.server;

    variants.add(jidEncode(decoded.user, normalizedServer));

    const isPnServer = normalizedServer === 's.whatsapp.net' || normalizedServer === 'hosted';
    const isLidServer = normalizedServer === 'lid' || normalizedServer === 'hosted.lid';

    if (isPnServer) {
      const lidUser = getLidMappingValue(decoded.user, 'pnToLid');
      if (lidUser) {
        const lidServer = normalizedServer === 'hosted' ? 'hosted.lid' : 'lid';
        variants.add(jidEncode(lidUser, lidServer));
      }
    } else if (isLidServer) {
      const pnUser = getLidMappingValue(decoded.user, 'lidToPn');
      if (pnUser) {
        const pnServer = normalizedServer === 'hosted.lid' ? 'hosted' : 's.whatsapp.net';
        variants.add(jidEncode(pnUser, pnServer));
      }
    }

    return Array.from(variants);
  } catch (error) {
    return [jid];
  }
};

// Find participant by either PN JID or LID JID
const findParticipant = (participants = [], userIds) => {
  const targets = (Array.isArray(userIds) ? userIds : [userIds])
    .filter(Boolean)
    .flatMap(id => buildComparableIds(id));

  if (!targets.length) return null;

  return participants.find(participant => {
    if (!participant) return false;
    rememberParticipantLidMap(participant);

    const participantIds = [
      participant.id,
      participant.lid,
      participant.userJid
    ]
      .filter(Boolean)
      .flatMap(id => buildComparableIds(id));

    return participantIds.some(id => targets.includes(id));
  }) || null;
};

const isAdmin = async (sock, participant, groupId, groupMetadata = null) => {
  if (!participant) return false;

  // Early return for non-group JIDs (DMs) - prevents slow sock.groupMetadata() call
  if (!groupId || !groupId.endsWith('@g.us')) {
    return false;
  }

  // Always fetch live metadata for admin checks
  let liveMetadata = groupMetadata;
  if (!liveMetadata || !liveMetadata.participants) {
    if (groupId) {
      liveMetadata = await getLiveGroupMetadata(sock, groupId);
    } else {
      return false;
    }
  }

  if (!liveMetadata || !liveMetadata.participants) return false;

  // Use findParticipant to handle LID matching
  const foundParticipant = findParticipant(liveMetadata.participants, participant);
  if (!foundParticipant) return false;

  return foundParticipant.admin === 'admin' || foundParticipant.admin === 'superadmin';
};

const isBotAdmin = async (sock, groupId, groupMetadata = null) => {
  if (!sock.user || !groupId) return false;
  if (!groupId.endsWith('@g.us')) return false;

  // Return from cache if still fresh — avoids a live network call every message
  const cached = botAdminCache.get(groupId);
  if (cached && Date.now() - cached.ts < BOT_ADMIN_TTL) return cached.isAdmin;

  try {
    const botId  = sock.user.id;
    const botLid = sock.user.lid;
    if (!botId) return false;

    const botJids = [botId];
    if (botLid) botJids.push(botLid);

    const liveMetadata = await getLiveGroupMetadata(sock, groupId);
    if (!liveMetadata || !liveMetadata.participants) return false;

    const participant = findParticipant(liveMetadata.participants, botJids);
    const isAdmin = !!(participant && (participant.admin === 'admin' || participant.admin === 'superadmin'));

    // Store result so the next ~2 minutes of messages skip the API call
    setBoundedCacheEntry(botAdminCache, groupId, { isAdmin, ts: Date.now() }, MAX_BOT_ADMIN_ENTRIES);
    return isAdmin;
  } catch {
    return false;
  }
};

const isUrl = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return urlRegex.test(text);
};

const hasGroupLink = (text) => {
  const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
  return linkRegex.test(text);
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

// System JID filter - checks if JID is from broadcast/status/newsletter
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
    // Debug logging to see all messages
    // Debug log removed

    if (!msg.message) return;


    // Store message for antidelete and antiedit
    try {
      const antidelete = commands.get('antidelete');
      if (antidelete?.storeMessage) antidelete.storeMessage(msg);
    } catch (_) {}
    try {
      const antiedit = commands.get('antiedit');
      if (antiedit?.storeMessage) antiedit.storeMessage(msg);
    } catch (_) {}

    // Cache view-once messages so emoji reactions can look them up later
    try { cacheViewOnceMsg(msg); } catch (_) {}

    // ── Emoji reaction → reveal view-once to DM ──────────────────────────────
    // When the bot owner (either the bot's own linked account reacting, i.e.
    // fromMe, or a configured sudo/owner number) reacts with any emoji to a
    // view-once message, the bot sends the media to sock.user.id's own chat.
    if (msg.message?.reactionMessage) {
      try {
        const _rxn = msg.message.reactionMessage;
        // When the reaction comes from the bot's own linked account (fromMe),
        // key.participant is empty/unreliable — fall back to our own JID so
        // isOwner/isSudo checks (and logging) still have something sane to use.
        const _rxSender = msg.key.fromMe
          ? getSelfJid(sock)
          : (msg.key.participant || msg.key.remoteJid);
        const _rxFrom = msg.key.remoteJid;
        // Trigger for the bot's own account (fromMe) OR owner/sudo users
        if (_rxn.text && (msg.key.fromMe || isOwner(_rxSender) || isSudo(_rxSender))) {
          const _origId = _rxn.key?.id;
          const _cached = _origId ? voCache.get(_origId) : null;
          if (_cached && _cached.expires > Date.now()) {
            const _selfJid = getSelfJid(sock);
            const _ok = await revealVoToDM(sock, _cached.msg, _selfJid);
            if (_ok) {
              // React ✅ on the original reaction message to confirm
              await sock.sendMessage(_rxFrom, { react: { text: '✅', key: msg.key } });
            }
          }
        }
      } catch (_rxErr) { console.error('[VO React]', _rxErr.message); }
      return; // reactions don't need further command processing
    }
    // ─────────────────────────────────────────────────────────────────────────

    // rc13 LID DMs: remoteJid is a @lid JID — resolve to phone JID so all
    // sock.sendMessage(from, ...) calls reach the user instead of silently failing.
    const _rawFrom = msg.key.remoteJid;
    const from = (!_rawFrom.endsWith('@g.us') && _rawFrom.endsWith('@lid') && msg.key.remoteJidAlt)
      ? msg.key.remoteJidAlt
      : _rawFrom;

    // Status updates are filtered from normal command processing, but the
    // auto-download-status command needs to see them first. Its SQLite
    // status_downloads guard makes this safe alongside index.js's status hook.
    if (_rawFrom === 'status@broadcast') {
      try {
        const statusCommand = commands.get('autodownloadstatus');
        if (statusCommand?.handleAutoDownloadStatus) {
          await statusCommand.handleAutoDownloadStatus(sock, msg.key, msg.message);
        }
      } catch (error) {
        console.error('[AutoDL-Status hook]', error.message);
      }
      return;
    }

    // System message filter - ignore broadcast/status/newsletter messages
    if (isSystemJid(_rawFrom)) {
      return; // Silently ignore system messages
    }

    // Unwrap containers first
    const content = getMessageContent(msg);
    // Note: We don't return early if content is null because forwarded status messages might not have content

    // Still check for actual message content for regular processing
    let actualMessageTypes = [];
    if (content) {
      const allKeys = Object.keys(content);
      // Filter out protocol/system messages and find actual message content
      const protocolMessages = ['protocolMessage', 'senderKeyDistributionMessage', 'messageContextInfo'];
      actualMessageTypes = allKeys.filter(key => !protocolMessages.includes(key));
    }

    // We'll check for empty content later after we've processed group messages

    // Use the first actual message type (conversation, extendedTextMessage, etc.)
    const messageType = actualMessageTypes[0];

    // Derive sender JID.
    // rc13 LID change: for @lid-based DMs remoteJid is a LID JID and remoteJidAlt
    // carries the phone-number JID.  Use the alt immediately so isOwner / command
    // checks get a real phone number without waiting for an async lookup.
    const _rawSender = msg.key.fromMe
      ? getSelfJid(sock)
      : msg.key.participant || msg.key.remoteJid;
    const _isGroupJid = from.endsWith('@g.us');
    const sender = (!_isGroupJid && isLidJid(_rawSender) && msg.key.remoteJidAlt)
      ? msg.key.remoteJidAlt   // phone JID available directly — skip async LID lookup
      : _rawSender;
    if (!_isGroupJid && isLidJid(_rawSender) && msg.key.remoteJidAlt) {
      rememberLidPair(_rawSender, msg.key.remoteJidAlt);
    }
    const isGroup = _isGroupJid;

    let reactionJid = from;
    let alwaysReactToTarget = !msg.key.fromMe && [sender, msg.key.remoteJidAlt].some((jid) => {
      const number = String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
      return ALWAYS_AUTO_REACT_NUMBERS.has(number);
    });
    if (!alwaysReactToTarget && !msg.key.fromMe && isLidJid(sender)) {
      try {
        const { resolvePhone } = require('./utils/jidHelper');
        const resolvedPhone = await resolvePhone(sock, sender);
        const number = String(resolvedPhone || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        alwaysReactToTarget = ALWAYS_AUTO_REACT_NUMBERS.has(number);
        // A direct LID chat without remoteJidAlt must be addressed by its PN JID.
        if (alwaysReactToTarget && isLidJid(from)) reactionJid = `${number}@s.whatsapp.net`;
      } catch (_) {}
    }
    if (alwaysReactToTarget && actualMessageTypes.length > 0) {
      try {
        await sock.sendMessage(reactionJid, { react: { text: '👑', key: msg.key } });
      } catch (error) {
        console.error('[AutoReact target]', error.message);
      }
    }

    // ── Presence on ANY incoming message (DM or group, never bot's own) ──────
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
    // ─────────────────────────────────────────────────────────────────────────

    // Fetch group metadata immediately if it's a group
    const groupMetadata = isGroup ? await getGroupMetadata(sock, from) : null;

    // ── Muted-user enforcement: silently delete their messages ────────────────
    if (isGroup && !msg.key.fromMe && sender) {
      try {
        if (database.isUserMuted(from, sender)) {
          await sock.sendMessage(from, { delete: msg.key });
          return; // stop all further processing
        }
      } catch (_muteErr) {}
    }

    // Anti-* protection — run ALL checks in parallel so they don't queue behind each other
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
      // DMs — still need AntiBug protection
      try { await handleAntibug(sock, msg, null, false, sender, from); } catch (_) {}
    }

    // Track group message statistics
    if (isGroup) {
      addMessage(from, sender);
    }

    // Return early for non-group messages with no recognizable content
    if (!content || actualMessageTypes.length === 0) return;

    // Button / native-flow response. gifted-btns and current WhatsApp send
    // interactiveResponseMessage.paramsJson, not the old buttonsResponseMessage.
    const buttonId = extractButtonId(content, msg);
    if (buttonId) {

      // Helper to build the standard extra object for command execution
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

      // Handle button clicks by routing to commands
      if (buttonId === 'btn_menu') {
        const extra = await makeExtra();
        const menuCmd = commands.get('menu');
        if (menuCmd) await menuCmd.execute(sock, msg, [], extra);
        return;

      // ── Named menu buttons (non-prefixed IDs) ─────────────────────────────
      } else if (buttonId === 'menu_repo') {
        const repoUrl = config.social?.github || 'https://github.com/clevertechn/black-hat-xmd';
        await sock.sendMessage(from, { text: `💻 *Bot Repository*\n${repoUrl}` }, { quoted: msg });
        return;

      } else if (buttonId === 'menu_yt') {
        const ytUrl = config.social?.youtube || 'http://youtube.com/@clevertechn';
        await sock.sendMessage(from, { text: `📺 *YouTube Channel*\n${ytUrl}` }, { quoted: msg });
        return;

      // ── Ping / uptime — execute directly ──────────────────────────────────
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

      // ── Generic fallback: buttonId starts with the bot prefix → run as command
      const cfgPrefix = config.prefix || '.';
      let routedId = String(buttonId).replace(/_(\d{8,})$/, '');
      if (routedId && routedId.startsWith(cfgPrefix)) {
        const parts   = routedId.slice(cfgPrefix.length).trim().split(/\s+/);
        const cmdName = (parts[0] || '').toLowerCase();
        const cmdArgs = parts.slice(1);
        const dynCmd  = commands.get(cmdName);
        if (dynCmd) {
          const extra = await makeExtra();
          extra.command = cmdName;
          extra.prefix  = cfgPrefix;
          extra.isOwner = msg.key.fromMe || extra.isOwner;
          extra.isSudo = extra.isOwner || extra.isSudo;
          extra.isMod = extra.isSudo;
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

    // Get message body from unwrapped content
    let body = '';
    if (content.conversation) {
      body = content.conversation;
    } else if (content.extendedTextMessage) {
      body = content.extendedTextMessage.text || '';
    } else if (content.imageMessage) {
      body = content.imageMessage.caption || '';
    } else if (content.videoMessage) {
      body = content.videoMessage.caption || '';
    }

    body = (body || '').trim();

    // AntiAll is a SQLite-backed group master toggle. It blocks messages from
    // non-admin/non-owner members before command dispatch.
    if (isGroup) {
      const groupSettings = database.getGroupSettings(from);
      // Never moderate messages sent by the connected WhatsApp account itself.
      // On a linked-device bot those are the owner's green "fromMe" messages.
      if (!msg.key.fromMe && database.isAntiAllEnabled(from)) {
        const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
        const senderIsOwner = isOwner(sender);

        if (!senderIsAdmin && !senderIsOwner) {
          const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
          if (botIsAdmin) {
            await sock.sendMessage(from, { delete: msg.key });
            return;
          }
        }
      }

      // Anti-tag protection (check BEFORE text check, as tagall can have no text)
      if (groupSettings.antitag && !msg.key.fromMe) {
        const ctx = content.extendedTextMessage?.contextInfo;
        const mentionedJids = ctx?.mentionedJid || [];

        const messageText = (
          body ||
          content.imageMessage?.caption ||
          content.videoMessage?.caption ||
          ''
        );

        const textMentions = messageText.match(/@[\d+\s\-()~.]+/g) || [];
        const numericMentions = messageText.match(/@\d{10,}/g) || [];

        const uniqueNumericMentions = new Set();
        numericMentions.forEach((mention) => {
          const numMatch = mention.match(/@(\d+)/);
          if (numMatch) uniqueNumericMentions.add(numMatch[1]);
        });

        const mentionedJidCount = mentionedJids.length;
        const numericMentionCount = uniqueNumericMentions.size;
        const totalMentions = Math.max(mentionedJidCount, numericMentionCount);

        if (totalMentions >= 3) {
          try {
            const participants = groupMetadata.participants || [];
            const mentionThreshold = Math.max(3, Math.ceil(participants.length * 0.5));
            const hasManyNumericMentions = numericMentionCount >= 10 ||
              (numericMentionCount >= 5 && numericMentionCount >= mentionThreshold);

            if (totalMentions >= mentionThreshold || hasManyNumericMentions) {
              const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
              const senderIsOwner = isOwner(sender);

              if (!senderIsAdmin && !senderIsOwner) {
                const action = (groupSettings.antitagAction || 'delete').toLowerCase();

                if (action === 'delete') {
                  try {
                    await sock.sendMessage(from, { delete: msg.key });
                    await sock.sendMessage(from, {
                      text: '⚠️ *Tagall Detected!*',
                      mentions: [sender]
                    }, { quoted: msg });
                  } catch (e) {
                    console.error('Failed to delete tagall message:', e);
                  }
                } else if (action === 'kick') {
                  try {
                    await sock.sendMessage(from, { delete: msg.key });
                  } catch (e) {
                    console.error('Failed to delete tagall message:', e);
                  }

                  const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
                  if (botIsAdmin) {
                    try {
                      await sock.groupParticipantsUpdate(from, [sender], 'remove');
                    } catch (e) {
                      console.error('Failed to kick for antitag:', e);
                    }
                    const usernames = [`@${sender.split('@')[0]}`];
                    await sock.sendMessage(from, {
                      text: `🚫 *Antitag Detected!*\n\n${usernames.join(', ')} has been kicked for tagging all members.`,
                      mentions: [sender],
                    }, { quoted: msg });
                  }
                }
                return;
              }
            }
          } catch (e) {
            console.error('Error during anti-tag enforcement:', e);
          }
        }
      }
    }

    // AutoSticker feature - convert images/videos to stickers automatically
    if (isGroup) { // Process all messages in groups (including bot's own messages)
      const groupSettings = database.getGroupSettings(from);
      if (groupSettings.autosticker) {
        const mediaMessage = content?.imageMessage || content?.videoMessage;

        // Only process if it's an image or video (not documents)
        if (mediaMessage) {
          // Skip if message has a command prefix (let command handle it)
          if (!body.startsWith(config.prefix)) {
            try {
              // Import sticker command logic
              const stickerCmd = commands.get('sticker');
              if (stickerCmd) {
                // Execute sticker conversion silently
                if (global._memoryIntensiveCommandActive) return;
                global._memoryIntensiveCommandActive = true;
                try {
                  await stickerCmd.execute(sock, msg, [], {
                  from,
                  sender,
                  isGroup,
                  groupMetadata,
                  isOwner: isOwner(sender),
                  isAdmin: await isAdmin(sock, sender, from, groupMetadata),
                  isBotAdmin: await isBotAdmin(sock, from, groupMetadata),
                  isMod: isMod(sender),
                  reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
                  react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } })
                  });
                } finally {
                  global._memoryIntensiveCommandActive = false;
                }
                return; // Don't process as command after auto-converting
              }
            } catch (error) {
              console.error('[AutoSticker Error]:', error);
              // Continue to normal processing if autosticker fails
            }
          }
        }
      }
    }

     // Check for active bomb games (before prefix check)
    try {
      const bombModule = require('./commands/fun/bomb');
      if (bombModule.gameState && bombModule.gameState.has(sender)) {
        const bombCommand = commands.get('bomb');
        if (bombCommand && bombCommand.execute) {
          // User has active game, process input
          await bombCommand.execute(sock, msg, [], {
            from,
            sender,
            isGroup,
            groupMetadata,
            isOwner: isOwner(sender),
            isAdmin: await isAdmin(sock, sender, from, groupMetadata),
            isBotAdmin: await isBotAdmin(sock, from, groupMetadata),
            isMod: isMod(sender),
            reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
            react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } })
          });
          return; // Don't process as command
        }
      }
    } catch (e) {
      // Silently ignore if bomb command doesn't exist or has errors
    }

    // Check for active tictactoe games (before prefix check)
    try {
      const tictactoeModule = require('./commands/fun/tictactoe');
      if (tictactoeModule.handleTicTacToeMove) {
        // Check if user is in an active game
        const isInGame = Object.values(tictactoeModule.games || {}).some(room =>
          room.id.startsWith('tictactoe') &&
          [room.game.playerX, room.game.playerO].includes(sender) &&
          room.state === 'PLAYING'
        );

        if (isInGame) {
          // User has active game, process input
          const handled = await tictactoeModule.handleTicTacToeMove(sock, msg, {
            from,
            sender,
            isGroup,
            groupMetadata,
            isOwner: isOwner(sender),
            isAdmin: await isAdmin(sock, sender, from, groupMetadata),
            isBotAdmin: await isBotAdmin(sock, from, groupMetadata),
            isMod: isMod(sender),
            reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
            react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } })
          });
          if (handled) return; // Don't process as command if move was handled
        }
      }
    } catch (e) {
      // Silently ignore if tictactoe command doesn't exist or has errors
    }


    // Fancy text style selection: reply to fancy list with just a number
    if (/^\d+$/.test(body.trim())) {
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';
      if (quotedText.includes('Fancy Text Styles') || quotedText.includes('Fancy Styles for:')) {
        const fancyCmd = commands.get('fancy');
        if (fancyCmd) {
          return fancyCmd.execute(sock, msg, [body.trim()], {
            from,
            sender,
            reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
            react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
          });
        }
      }
    }

    // My groups: reply to group list with just a number to get group details
    if (/^\d+$/.test(body.trim())) {
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';
      if (quotedText.includes('📋') && quotedText.includes('Group List')) {
        const mygroupsCmd = commands.get('mygroups');
        if (mygroupsCmd) {
          return mygroupsCmd.execute(sock, msg, [body.trim()], {
            from,
            sender,
            command: 'mygroups',
            prefix: config.prefix,
            reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
            react: (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
          });
        }
      }
    }

    // ────────────────────────────────────────────────────────────────────────────

    // ── Sticker / single-emoji → auto-reveal view-once ───────────────────────────
    // When the bot owner replies to a view-once with any sticker or a bare emoji,
    // intercept here (before the prefix gate) and run the .vv command directly.
    // Trigger applies for: the bot's own linked account (fromMe) OR an owner/sudo
    // number — previously fromMe was explicitly excluded, which meant your own
    // device could never trigger the reveal.
    {
        const _isSticker     = !!msg.message?.stickerMessage;
        const _rawBody       = msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';
        const _t             = _rawBody.trim();
        const _isSingleEmoji = _t.length > 0 && _t.length <= 16 &&
            /^\p{Emoji}/u.test(_t) && !/^[a-zA-Z0-9./#]/.test(_t);

        if ((_isSticker || _isSingleEmoji) && (msg.key.fromMe || isOwner(sender) || isSudo(sender))) {
            // Extract contextInfo from whichever wrapper is present
            const _ctx =
                msg.message?.stickerMessage?.contextInfo ||
                msg.message?.extendedTextMessage?.contextInfo ||
                msg.message?.imageMessage?.contextInfo ||
                msg.message?.videoMessage?.contextInfo;

            const _quoted = _ctx?.quotedMessage;

            if (_quoted) {
                // Check that the quoted message is actually a view-once
                const _isVO =
                    !!_quoted.viewOnceMessageV2Extension ||
                    !!_quoted.viewOnceMessageV2 ||
                    !!_quoted.viewOnceMessage ||
                    !!_quoted?.imageMessage?.viewOnce ||
                    !!_quoted?.videoMessage?.viewOnce ||
                    !!_quoted?.audioMessage?.viewOnce;

                if (_isVO) {
                    try {
                        const voCmd = commands.get('vv');
                        if (voCmd?.execute) {
                            await voCmd.execute(sock, msg, [], {
                                from,
                                sender,
                                isOwner: true,
                                command: 'vv',
                                reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
                                react:  (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
                            });
                        }
                    } catch (_e) {}
                    return;
                }

                // ── Sticker / emoji reply to a status → save to bot self-chat ──
                if (_ctx?.remoteJid === 'status@broadcast') {
                    try {
                        const saveCmd = commands.get('save');
                        if (saveCmd?.execute) {
                            await saveCmd.execute(sock, msg, [], {
                                from,
                                sender,
                                isOwner: msg.key.fromMe || isOwner(sender) || isSudo(sender),
                                command: 'save',
                                forwardToSelf: true,           // sticker/emoji detected here — forward to selfJid
                                triggerLabel: _isSticker ? '🎭 *Trigger:* Sticker' : `💌 *Emoji:* ${_t}`,
                                reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
                                react:  (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
                            });
                        }
                    } catch (_e) {}
                    return;
                }
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────────

    // Prefix gate — determine whether this message even looks like a command attempt.
    // When prefix is empty ('') every message is a potential command (intentional),
    // but that means "command not found" below is what routes to chatbot instead
    // of the prefix check itself.
    
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

    // General Auto-React runs after command resolution so "bot" mode reacts only to
    // a real, registered command using the configured prefix—not merely any
    // message that starts with punctuation. It remains before command
    // permissions/dispatch by design, so valid command attempts can be
    // acknowledged even when their command later denies access.
    try {
      const arSettings = getCachedArSettings();
      const sourceMatches = arSettings.mode === 'all' ||
        (arSettings.mode === 'bot' && Boolean(command));
      const { canTargetChat } = require('./utils/autoReact');

      if (
        !alwaysReactToTarget &&
        arSettings.enabled &&
        !msg.key.fromMe &&
        sourceMatches &&
        canTargetChat(arSettings.target, isGroup)
      ) {
        const { reactions } = require('./utils/emojis');
        const emoji = arSettings.randomMode && Array.isArray(reactions) && reactions.length
          ? reactions[Math.floor(Math.random() * reactions.length)]
          : arSettings.fixedEmoji;

        if (emoji) {
          await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
        }
      }
    } catch (e) {
      // A reaction failure must never block normal command/message handling.
      console.error('[AutoReact Error]', e.message);
    }

    // No command matched — either no prefix was used, or (in empty-prefix mode)
    // the first word just isn't a real command name. Either way, fall through
    // to the chatbot auto-reply so plain conversation still gets a response.
       if (!command) {
    const hasMedia = !!(
        msg.message?.imageMessage ||
        msg.message?.stickerMessage ||
        msg.message?.ephemeralMessage?.message?.imageMessage ||
        msg.message?.ephemeralMessage?.message?.stickerMessage ||
        msg.message?.viewOnceMessageV2?.message?.imageMessage ||
        msg.message?.viewOnceMessage?.message?.imageMessage
    );

    if ((body.trim() || hasMedia) && !msg.key.fromMe) {
        try {
            const chatbotCmd = commands.get('chatbot');
            if (chatbotCmd?.handleAutoReply) {
                await chatbotCmd.handleAutoReply(sock, msg, { from, isGroup, commands });
            }
        } catch (e) {
            // Never let chatbot errors break the message handler
        }
    }
    return;
}
    
       let resolvedSender = sender;
    try {
      const { jidDecode: _jidDec } = require('@whiskeysockets/baileys');
      const { getLidMappingValue } = require('./utils/jidHelper');
      const decoded = sender ? _jidDec(sender) : null;
      const server  = decoded?.server;
      const isLidServer = server === 'lid' || server === 'hosted.lid';

      if (isLidServer && decoded?.user) {
        if (isGroup && groupMetadata?.participants) {
          // Group path: resolve via participant list (most authoritative for groups)
          const matched = groupMetadata.participants.find(p => {
            if (!p) return false;
            const pId  = typeof p === 'string' ? p : (p.id  || p.jid || '');
            const pLid = typeof p === 'string' ? '' : (p.lid || '');
            return pId === sender || pLid === sender;
          });
          if (matched && typeof matched === 'object') {
            rememberParticipantLidMap(matched);
            const pn = matched.phoneNumber || matched.pn;
            if (pn) resolvedSender = pn.includes('@') ? pn : `${pn}@s.whatsapp.net`;
          }
          // Fallback to the SQLite LID map if participant data had no phone number
          if (resolvedSender === sender) {
            const pnUser = getLidMappingValue(decoded.user, 'lidToPn');
            if (pnUser) resolvedSender = `${pnUser}@s.whatsapp.net`;
          }
        } else if (!isGroup) {
          // DM path: use Baileys in-memory LID state first, then the persisted
          // SQLite lid_map value. By messages.upsert, Baileys often already has
          // the mapping from remoteJidAlt, and resolvePhone persists it.
          try {
            const { resolvePhone } = require('./utils/jidHelper');
            const pn = await resolvePhone(sock, sender);
            if (pn) resolvedSender = `${pn}@s.whatsapp.net`;
          } catch (_) {
            // Fallback: mapping already stored in SQLite.
            const pnUser = getLidMappingValue(decoded.user, 'lidToPn');
            if (pnUser) resolvedSender = `${pnUser}@s.whatsapp.net`;
          }
        }
      }
    } catch (_lidErr) {
      // Never let resolution errors block command execution
    }
    // ─────────────────────────────────────────────────────────────────────────

    const senderIsOwner = msg.key.fromMe || isOwner(resolvedSender);
    const senderIsSudo  = senderIsOwner || isSudo(resolvedSender);

    // Self mode — bot only responds to its own messages (self-bot mode)
    if (config.selfMode && !msg.key.fromMe) return;

    // Bot mode check
    {
      const { getMode } = require('./utils/botMode');
      const botModeVal = getMode();
      // Accept both the user-facing names and the old silent/groups/dms rows.
      if ((botModeVal === 'private' || botModeVal === 'silent') && !senderIsSudo) {
        return;
      }
      if ((botModeVal === 'group' || botModeVal === 'groups') && !isGroup && !senderIsSudo) {
        return;
      }
      if ((botModeVal === 'pm' || botModeVal === 'dms') && isGroup && !senderIsSudo) {
        return;
      }
    }

    // Permission checks
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

    if (command.botAdminNeeded) {
      const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
      if (!botIsAdmin) {
        return sock.sendMessage(from, { text: config.messages.botAdminNeeded }, { quoted: msg });
      }
    }

    // Auto presence indicators — read from database/bot-settings.json via presenceSettings
    try {
      const { getModeFor } = require('./utils/presenceSettings');
      const presenceMode = getModeFor(from);
      if (presenceMode === 'recordtype') {
        await sock.sendPresenceUpdate('recording', from);
        await new Promise(r => setTimeout(r, 1500));
        await sock.sendPresenceUpdate('composing', from);
        await new Promise(r => setTimeout(r, 800));
      } else if (presenceMode === 'recording') {
        await sock.sendPresenceUpdate('recording', from);
        await new Promise(r => setTimeout(r, 1000));
      } else if (presenceMode === 'typing') {
        await sock.sendPresenceUpdate('composing', from);
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (presenceErr) {
      // Never let presence failure block the command
      console.error('[PRESENCE] error:', presenceErr.message);
    }

    // Colored command execution log
    const chalk = require('chalk');
    const senderNum = sender.split('@')[0].split(':')[0];
    console.log(
      chalk.magenta.bold('[ CMD ]'),
      chalk.cyan(`✦ ${commandName}`),
      chalk.yellow(`← ${senderNum}`),
      senderIsOwner ? chalk.green('[OWNER]') : senderIsSudo ? chalk.blue('[SUDO]') : chalk.white('[USER]')
    );

    const { applyFont } = require('./utils/fontConverter');
    const memoryIntensive = ['media', 'aivideo'].includes(command.category) || MEMORY_INTENSIVE_COMMANDS.has(command.name);
    if (memoryIntensive && global._memoryIntensiveCommandActive) {
      await sock.sendMessage(from, {
        text: 'A media or memory-intensive command is already running. Please retry shortly.'
      }, { quoted: msg });
      return;
    }
    if (memoryIntensive) global._memoryIntensiveCommandActive = true;
    try {
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

    // Don't send error messages for rate limit errors
    if (error.message && error.message.includes('rate-overlimit')) {
      return;
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `${config.messages.error}\n\n${error.message}`
      }, { quoted: msg });
    } catch (e) {
      // Don't log rate limit errors when sending error messages
      if (!e.message || !e.message.includes('rate-overlimit')) {
        console.error('Error sending error message:', e);
      }
    }
  }
};

// Group participant update handler
const handleGroupUpdate = async (sock, update) => {
  try {
    const { id, participants, action, author: actor } = update;

    // Validate group JID before processing
    if (!id || !id.endsWith('@g.us')) {
      return;
    }

    // ── AntiDemote / AntiPromote ────────────────────────────────────────
    if (action === 'demote' || action === 'promote') {
      try {
        const antidemoteCmd  = commands.get('antidemote');
        const antipromoteCmd = commands.get('antipromote');

        // Resolve actor — could be a lid JID; normalize to phone JID
        let resolvedActor = actor || null;
        if (resolvedActor) {
          try { resolvedActor = normalizeJidWithLid(resolvedActor) || resolvedActor; } catch (_) {}
        }

        for (const participant of participants) {
          // Participants may be plain string JIDs or objects with phoneNumber/pn
          let pJid = typeof participant === 'string'
            ? participant
            : (participant?.phoneNumber || participant?.pn || participant?.id || participant?.jid || null);
          if (!pJid) continue;

          if (action === 'demote' && antidemoteCmd?.handleDemote) {
            await antidemoteCmd.handleDemote(sock, id, resolvedActor, pJid);
          }
          if (action === 'promote' && antipromoteCmd?.handlePromote) {
            await antipromoteCmd.handlePromote(sock, id, resolvedActor, pJid);
          }
        }
      } catch (e) {
        console.error('[handleGroupUpdate] antidemote/antipromote error:', e.message);
      }
    }

    const groupSettings = database.getGroupSettings(id);

    if (!groupSettings.welcome && !groupSettings.goodbye) return;

    const groupMetadata = await getGroupMetadata(sock, id);
    if (!groupMetadata) return; // Skip if metadata unavailable (forbidden or error)

    // Helper to extract participant JID
    const getParticipantJid = (participant) => {
      if (typeof participant === 'string') {
        return participant;
      }
      if (participant && participant.id) {
        return participant.id;
      }
      if (participant && typeof participant === 'object') {
        // Try to find JID in object
        return participant.jid || participant.participant || null;
      }
      return null;
    };

    for (const participant of participants) {
      const participantJid = getParticipantJid(participant);
      if (!participantJid) {
        console.warn('Could not extract participant JID:', participant);
        continue;
      }

      const participantNumber = participantJid.split('@')[0];

      if (action === 'add') {
        // AntiBot check on join
        try {
          const antibot = commands.get('antibot');
          if (antibot?.handleGroupJoin) await antibot.handleGroupJoin(sock, id, participantJid);
        } catch (_) {}

        // AntiForeign check on join
        try {
          const antiforeign = commands.get('antiforeign');
          if (antiforeign?.handleGroupJoin) await antiforeign.handleGroupJoin(sock, id, participantJid);
        } catch (_) {}
      }

      // ── Shared helpers for welcome / goodbye ──────────────────────────────
      const buildMsg = (template, vars) => {
        return (template || '')
          .replace(/@user/g, `@${vars.number}`)
          .replace(/@group/g, vars.groupName)
          .replace(/groupDesc/g, vars.groupDesc)
          .replace(/time/g, vars.timeString)
          .replace(/#memberCount/g, String(vars.memberCount))
          .replace(/botName/g, config.botName);
      };

      // Fetch profile pic as Buffer: tries member first, then group, returns null if both fail
      const fetchPpBuffer = async (memberJid, groupJid) => {
        try {
          const url = await sock.profilePictureUrl(memberJid, 'image');
          const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
          return Buffer.from(res.data);
        } catch (_) {}
        try {
          const url = await sock.profilePictureUrl(groupJid, 'image');
          const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
          return Buffer.from(res.data);
        } catch (_) {}
        return null;
      };
      // ─────────────────────────────────────────────────────────────────────

      if (action === 'add' && groupSettings.welcome) {
        try {
          const groupName  = groupMetadata.subject || 'the group';
          const groupDesc  = groupMetadata.desc || 'No description';
          const now        = new Date();
          const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          const memberCount = groupMetadata.participants.length;

          const msgText = buildMsg(
            groupSettings.welcomeMessage,
            { number: participantNumber, groupName, groupDesc, timeString, memberCount }
          );

          const noPP = groupSettings.welcomeNoPP === true;

          if (noPP) {
            await sock.sendMessage(id, { text: msgText, mentions: [participantJid] });
          } else {
            const ppBuffer = await fetchPpBuffer(participantJid, id);
            if (ppBuffer) {
              await sock.sendMessage(id, {
                image: ppBuffer,
                caption: msgText,
                mentions: [participantJid]
              });
            } else {
              await sock.sendMessage(id, { text: msgText, mentions: [participantJid] });
            }
          }
        } catch (welcomeError) {
          console.error('Welcome error:', welcomeError);
          try {
            const fallback = (groupSettings.welcomeMessage || 'Welcome @user to @group! 👋')
              .replace(/@user/g, `@${participantNumber}`)
              .replace(/@group/g, groupMetadata.subject || 'the group');
            await sock.sendMessage(id, { text: fallback, mentions: [participantJid] });
          } catch (_) {}
        }
      } else if (action === 'remove' && groupSettings.goodbye) {
        try {
          const groupName  = groupMetadata.subject || 'the group';
          const groupDesc  = groupMetadata.desc || 'No description';
          const now        = new Date();
          const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          const memberCount = groupMetadata.participants.length;

          const msgText = buildMsg(
            groupSettings.goodbyeMessage,
            { number: participantNumber, groupName, groupDesc, timeString, memberCount }
          );

          const noPP = groupSettings.welcomeNoPP === true;

          if (noPP) {
            await sock.sendMessage(id, { text: msgText, mentions: [participantJid] });
          } else {
            const ppBuffer = await fetchPpBuffer(participantJid, id);
            if (ppBuffer) {
              await sock.sendMessage(id, {
                image: ppBuffer,
                caption: msgText,
                mentions: [participantJid]
              });
            } else {
              await sock.sendMessage(id, { text: msgText, mentions: [participantJid] });
            }
          }
        } catch (goodbyeError) {
          console.error('Goodbye error:', goodbyeError);
          try {
            const fallback = (groupSettings.goodbyeMessage || 'Goodbye @user 👋')
              .replace(/@user/g, `@${participantNumber}`)
              .replace(/@group/g, groupMetadata.subject || 'the group');
            await sock.sendMessage(id, { text: fallback, mentions: [participantJid] });
          } catch (_) {}
        }
      }
    }
  } catch (error) {
    // Silently handle forbidden errors and other group metadata errors
    if (error.message && (
      error.message.includes('forbidden') ||
      error.message.includes('403') ||
      error.statusCode === 403 ||
      error.output?.statusCode === 403 ||
      error.data === 403
    )) {
      // Silently skip forbidden groups
      return;
    }
    // Only log non-forbidden errors
    if (!error.message || !error.message.includes('forbidden')) {
      console.error('Error handling group update:', error);
    }
  }
};

// Collect every text/url WhatsApp may hide a link in (previews, cards, wrappers).
const collectAntilinkText = (msg) => {
  const parts = [];
  const push = (value) => {
    if (value == null) return;
    if (typeof value === 'string') {
      if (value.trim()) parts.push(value);
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      parts.push(String(value));
    }
  };

  const walk = (node, depth = 0) => {
    if (!node || depth > 6) return;
    if (typeof node === 'string') {
      push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node !== 'object') return;

    push(node.conversation);
    push(node.text);
    push(node.caption);
    push(node.matchedText);
    push(node.canonicalUrl);
    push(node.description);
    push(node.title);
    push(node.sourceUrl);
    push(node.mediaUrl);
    push(node.originalUrl);
    push(node.thumbnailUrl);
    push(node.body?.text);
    push(node.header?.title);
    push(node.header?.subtitle);
    push(node.footer?.text);
    push(node.hydratedContentText);
    push(node.contentText);
    push(node.selectedDisplayText);

    const wrappers = [
      node.ephemeralMessage?.message,
      node.viewOnceMessage?.message,
      node.viewOnceMessageV2?.message,
      node.viewOnceMessageV2Extension?.message,
      node.documentWithCaptionMessage?.message,
      node.editedMessage?.message,
      node.extendedTextMessage,
      node.imageMessage,
      node.videoMessage,
      node.documentMessage,
      node.buttonsMessage,
      node.templateMessage,
      node.templateMessage?.hydratedTemplate,
      node.templateMessage?.hydratedFourRowTemplate,
      node.listMessage,
      node.interactiveMessage,
      node.interactiveMessage?.body,
      node.interactiveMessage?.header,
      node.interactiveMessage?.nativeFlowMessage,
      node.highlyStructuredMessage,
      node.contextInfo,
      node.contextInfo?.externalAdReply,
      node.contextInfo?.externalAdReplyInfo,
      node.extendedTextMessage?.contextInfo,
      node.extendedTextMessage?.contextInfo?.externalAdReply,
      node.imageMessage?.contextInfo?.externalAdReply,
      node.videoMessage?.contextInfo?.externalAdReply,
    ];
    for (const child of wrappers) walk(child, depth + 1);

    if (Array.isArray(node.nativeFlowMessage?.buttons)) {
      for (const button of node.nativeFlowMessage.buttons) {
        push(button?.buttonParamsJson);
        push(button?.name);
      }
    }
  };

  walk(msg?.message);
  return parts.join('\n').replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');
};

const ANTILINK_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'）】]+|(?:chat\.whatsapp\.com|wa\.me|t\.me|vm\.tiktok\.com|vt\.tiktok\.com|tiktok\.com|instagram\.com|instagr\.am|youtu\.be|youtube\.com|facebook\.com|fb\.watch|fb\.com|x\.com|twitter\.com|spotify\.com|soundcloud\.com|t\.co)\/[^\s<>"']+/i;

const messageHasLink = (msg) => ANTILINK_PATTERN.test(collectAntilinkText(msg));

const resolveGroupJid = (msg, fromHint) => {
  if (fromHint && String(fromHint).endsWith('@g.us')) return fromHint;
  if (msg?.key?.remoteJid?.endsWith('@g.us')) return msg.key.remoteJid;
  if (msg?.key?.remoteJidAlt?.endsWith('@g.us')) return msg.key.remoteJidAlt;
  return fromHint || msg?.key?.remoteJid;
};

const resolveParticipantPn = (msg, senderHint) => {
  const candidates = [
    msg?.key?.participantAlt,
    senderHint,
    msg?.key?.participant,
    msg?.key?.remoteJidAlt,
  ].filter(Boolean);

  for (const value of candidates) {
    if (isLidJid(value)) {
      const pnUser = getLidMappingValue(value, 'lidToPn');
      if (pnUser) {
        rememberLidPair(value, pnUser);
        return `${String(pnUser).split('@')[0].split(':')[0]}@s.whatsapp.net`;
      }
      continue;
    }
    if (String(value).endsWith('@s.whatsapp.net') || String(value).endsWith('@hosted')) {
      return value;
    }
  }

  return senderHint || msg?.key?.participant || msg?.key?.remoteJid;
};

const mentionUser = (jid) => String(jid || '').split('@')[0].split(':')[0];

const ANTILINK_DEBUG_FILE = path.join(__dirname, 'antilink-debug.json');

const safeJson = (value) => {
  try {
    return JSON.parse(JSON.stringify(value, (key, nested) => {
      if (Buffer.isBuffer(nested)) return `[Buffer ${nested.length}]`;
      if (nested && typeof nested === 'object' && nested.type === 'Buffer' && Array.isArray(nested.data)) {
        return `[Buffer ${nested.data.length}]`;
      }
      if (typeof nested === 'string' && nested.length > 500) return `${nested.slice(0, 500)}…`;
      return nested;
    }));
  } catch (error) {
    return { error: error.message };
  }
};

const writeAntilinkDebug = (dump) => {
  try {
    fs.writeFileSync(ANTILINK_DEBUG_FILE, JSON.stringify(dump, null, 2));
  } catch (error) {
    console.error('[ANTILINK DEBUG] could not write file:', error.message);
  }
};

// Antilink handler
const handleAntilink = async (sock, msg, groupMetadata, fromHint, senderHint) => {
  try {
    if (!msg?.message || msg.key?.fromMe) return;

    const from = resolveGroupJid(msg, fromHint);
    const sender = senderHint || msg.key.participant || msg.key.remoteJid;
    const mentionJid = resolveParticipantPn(msg, sender);
    if (!from || !String(from).endsWith('@g.us')) return;

    const groupSettings = database.getGroupSettings(from);
    const collectedText = collectAntilinkText(msg);
    const hasLink = ANTILINK_PATTERN.test(collectedText);
    const content = getMessageContent(msg) || {};
    const dump = {
      time: new Date().toISOString(),
      decision: 'pending',
      from,
      fromHint: fromHint || null,
      sender,
      mentionJid,
      senderHint: senderHint || null,
      key: {
        remoteJid: msg.key?.remoteJid || null,
        remoteJidAlt: msg.key?.remoteJidAlt || null,
        participant: msg.key?.participant || null,
        participantAlt: msg.key?.participantAlt || null,
        fromMe: !!msg.key?.fromMe,
        id: msg.key?.id || null,
        addressingMode: msg.key?.addressingMode || null,
      },
      rawMessageKeys: Object.keys(msg.message || {}),
      unwrappedKeys: Object.keys(content),
      oldBody: content.conversation ||
        content.extendedTextMessage?.text ||
        content.imageMessage?.caption ||
        content.videoMessage?.caption ||
        '',
      collectedText,
      hasLink,
      antilinkEnabled: !!groupSettings.antilink,
      antilinkAction: groupSettings.antilinkAction || 'delete',
      settingsKeys: Object.keys(groupSettings || {}),
      message: safeJson(msg.message),
    };

    if (!groupSettings.antilink) {
      dump.decision = 'skip: antilink-off';
      writeAntilinkDebug(dump);
      return;
    }

    if (!hasLink) {
      dump.decision = 'skip: no-link-detected';
      writeAntilinkDebug(dump);
      console.log('[ANTILINK DEBUG] no link detected');
      console.log('[ANTILINK DEBUG] keys:', dump.rawMessageKeys.join(', ') || '(none)');
      console.log('[ANTILINK DEBUG] oldBody:', JSON.stringify(dump.oldBody));
      console.log('[ANTILINK DEBUG] collectedText:', JSON.stringify(collectedText));
      return;
    }

    const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata)
      || await isAdmin(sock, mentionJid, from, groupMetadata);
    const senderIsOwner = isOwner(sender) || isOwner(mentionJid);
    dump.senderIsAdmin = senderIsAdmin;
    dump.senderIsOwner = senderIsOwner;
    // Group admins can post links. Bot owners are NOT skipped — otherwise a
    // second owner number used as a regular member can never be moderated.
    if (senderIsAdmin) {
      dump.decision = 'skip: sender-admin';
      writeAntilinkDebug(dump);
      console.log('[ANTILINK DEBUG]', dump.decision, 'sender=', sender, 'mentionJid=', mentionJid);
      return;
    }

    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    dump.botIsAdmin = botIsAdmin;
    if (!botIsAdmin) {
      dump.decision = 'skip: bot-not-admin';
      writeAntilinkDebug(dump);
      console.log('[ANTILINK DEBUG] bot is not admin in', from);
      return;
    }

    dump.decision = 'delete';
    writeAntilinkDebug(dump);
    console.log('[ANTILINK DEBUG] deleting link from', mentionJid, 'text=', JSON.stringify(collectedText.slice(0, 180)));

    const action = String(groupSettings.antilinkAction || 'delete').toLowerCase();
    const senderNum = mentionUser(mentionJid);
    const mentionTarget = mentionJid || sender;
    const deleteKey = {
      remoteJid: from,
      fromMe: msg.key.fromMe || false,
      id: msg.key.id,
      participant: msg.key.participant || sender,
    };

    if (action === 'warn') {
      const count = Number(database.addWarning(from, sender, 'Sent a link')) || 0;
      const maxWarns = config.maxWarnings || 3;
      try { await sock.sendMessage(from, { delete: deleteKey }); } catch (_) {}

      if (count >= maxWarns) {
        try {
          await sock.groupParticipantsUpdate(from, [sender], 'remove');
          await sock.sendMessage(from, {
            text: `🔗 @${senderNum} has been removed.\n⚠️ Reached ${maxWarns}/${maxWarns} warnings for sending links.`,
            mentions: [mentionTarget],
          });
          database.clearWarnings(from, sender);
        } catch (e) { console.error('Failed to kick after max warns (antilink):', e); }
      } else {
        await sock.sendMessage(from, {
          text: `🔗 @${senderNum} warned ⚠️\n\n📌 Reason: Sending links is not allowed\n⚠️ Warnings: ${count}/${maxWarns}\n\n_${maxWarns - count} more warning(s) before removal._`,
          mentions: [mentionTarget],
        });
      }

    } else if (action === 'kick') {
      try {
        await sock.sendMessage(from, { delete: deleteKey });
        await sock.groupParticipantsUpdate(from, [sender], 'remove');
        await sock.sendMessage(from, {
          text: `🔗 @${senderNum} has been removed for sending a link.`,
          mentions: [mentionTarget],
        });
      } catch (e) { console.error('Failed to kick for antilink:', e); }

    } else {
      try {
        await sock.sendMessage(from, { delete: deleteKey });
        await sock.sendMessage(from, {
          text: `🔗 @${senderNum}'s message was deleted.\n📌 Reason: Links are not allowed in this group.`,
          mentions: [mentionTarget],
        });
      } catch (e) { console.error('Failed to delete for antilink:', e); }
    }
  } catch (error) {
    console.error('Error in antilink handler:', error);
  }
};


// Anti-bad-word handler
const handleAntibadword = async (sock, msg, groupMetadata) => {
  try {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    const groupSettings = database.getGroupSettings(from);
    if (!groupSettings.antibadword) return;

    const badwords = database.getBadWords(from);
    if (!badwords.length) return;

    const body = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption || ''
    ).toLowerCase();

    if (!body) return;

    const found = badwords.find(word => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(body);
    });

    if (!found) return;

    const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
    const senderIsOwner = isOwner(sender);
    if (senderIsAdmin || senderIsOwner) return;

    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    if (!botIsAdmin) return;

    const action = (groupSettings.antibadwordAction || 'warn').toLowerCase();

    if (action === 'kick') {
      try {
        await sock.sendMessage(from, { delete: msg.key });
        await sock.groupParticipantsUpdate(from, [sender], 'remove');
        await sock.sendMessage(from, {
          text: `🤬 @${sender.split('@')[0]} was *kicked* for using a bad word: _${found}_`,
          mentions: [sender]
        });
      } catch (e) {
        console.error('AntiBadWord kick error:', e);
      }

    } else if (action === 'delete') {
      try {
        await sock.sendMessage(from, { delete: msg.key });
        await sock.sendMessage(from, {
          text: `🤬 @${sender.split('@')[0]}, watch your language! Bad word detected: _${found}_`,
          mentions: [sender]
        });
      } catch (e) {
        console.error('AntiBadWord delete error:', e);
      }

    } else {
      // Default: warn
      try {
        await sock.sendMessage(from, { delete: msg.key });
        const warnings = database.addWarning(from, sender, `Bad word: ${found}`);
        let text = `⚠️ @${sender.split('@')[0]}, you have been *warned* for using a bad word: _${found}_\n`;
        text += `Warnings: *${warnings.count}/${config.maxWarnings}*\n`;

        if (warnings.count >= config.maxWarnings) {
          text += `\n❌ Maximum warnings reached. You have been *removed* from the group!`;
          await sock.sendMessage(from, { text, mentions: [sender] });
          await sock.groupParticipantsUpdate(from, [sender], 'remove');
          database.clearWarnings(from, sender);
        } else {
          text += `\n_Further violations may result in a kick._`;
          await sock.sendMessage(from, { text, mentions: [sender] });
        }
      } catch (e) {
        console.error('AntiBadWord warn error:', e);
      }
    }
  } catch (error) {
    console.error('Error in antibadword handler:', error);
  }
};

// Anti-group mention handler
const handleAntigroupmention = async (sock, msg, groupMetadata) => {
  try {
    const from = msg.key.remoteJid;
    const groupSettings = database.getGroupSettings(from);
    if (!groupSettings.antigroupmention) return;

    // ── Sender detection ──────────────────────────────────────────────────────
    let sender =
      msg.message?.groupStatusMentionMessage?.participant ||
      msg.key.participant ||
      msg.key.remoteJid;

    // Normalise: strip device suffix (:X) so JID comparisons work
    if (sender && sender.includes(':')) {
      sender = sender.split(':')[0] + '@s.whatsapp.net';
    }

    // ── Diagnostics: keep the latest event in SQLite telemetry ───────────────
    // This is intentionally bounded/upserted by event type + group key, rather
    // than writing a separate debug JSON file for every observed message.
    try {
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.contextInfo || null;
      database.recordRuntimeTelemetry('anti-group-mention', from, {
        sender,
        keyParticipant: msg.key.participant || null,
        messageTypes: Object.keys(msg.message || {}),
        hasGroupStatusMention: !!msg.message?.groupStatusMentionMessage,
        groupStatusParticipant: msg.message?.groupStatusMentionMessage?.participant || null,
        context: contextInfo ? {
          mentionedJid: contextInfo.mentionedJid || [],
          statusMentionedJidList: contextInfo.statusMentionedJidList || [],
          hasForwardedNewsletterInfo: !!contextInfo.forwardedNewsletterMessageInfo,
          externalSourceType: contextInfo.externalAdReplyInfo?.sourceType || null,
        } : null,
      });
    } catch (_) {}

    // ── Detection ─────────────────────────────────────────────────────────────
    let isStatusMention = false;

    if (msg.message) {
      // 1. Direct Baileys type
      if (msg.message.groupStatusMentionMessage) isStatusMention = true;

      // 2. protocolMessage type 25 (ephemeral status mention)
      if (msg.message.protocolMessage?.type === 25) isStatusMention = true;

      // 3. contextInfo-based checks across all message types
      const checkCtx = (ctx) => {
        if (!ctx) return false;
        if (ctx.forwardedNewsletterMessageInfo) return true;
        if (ctx.externalAdReplyInfo?.sourceType === 'status') return true;
        if (Array.isArray(ctx.statusMentionedJidList) && ctx.statusMentionedJidList.length > 0) return true;
        if (Array.isArray(ctx.mentionedJid) && ctx.mentionedJid.some(j => j === from)) return true;
        return false;
      };

      const ctxSources = [
        msg.message.extendedTextMessage?.contextInfo,
        msg.message.imageMessage?.contextInfo,
        msg.message.videoMessage?.contextInfo,
        msg.message.stickerMessage?.contextInfo,
        msg.message.audioMessage?.contextInfo,
        msg.message.documentMessage?.contextInfo,
        msg.message.contextInfo,
      ];
      for (const ctx of ctxSources) {
        if (checkCtx(ctx)) { isStatusMention = true; break; }
      }

      // 4. Text-based fallback — WhatsApp embeds this exact phrase in the message
      const msgText =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption || '';
      if (/you mentioned this group|mentioned this group/i.test(msgText)) isStatusMention = true;
    }

    if (!isStatusMention) return;

    // ── Guards ────────────────────────────────────────────────────────────────
    const senderIsAdmin = sender.endsWith('@g.us')
      ? false  // group JID is never a user admin — skip check
      : await isAdmin(sock, sender, from, groupMetadata);
    const senderIsOwner = isOwner(sender);
    if (senderIsAdmin || senderIsOwner) return;

    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    if (!botIsAdmin) {
      console.log('[AGM] Bot is not admin — cannot take action in', from);
      return;
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    const action    = (groupSettings.antigroupmentionAction || 'delete').toLowerCase();
    const senderNum = sender.split('@')[0];

    if (action === 'warn') {
      const warnData  = database.addWarning(from, sender, 'Status mention in group');
      const maxWarns  = config.maxWarnings || 3;
      try { await sock.sendMessage(from, { delete: msg.key }); } catch (_) {}

      if (warnData.count >= maxWarns) {
        try {
          await sock.groupParticipantsUpdate(from, [sender], 'remove');
          await sock.sendMessage(from, {
            text: `🛡️ @${senderNum} has been removed.\n⚠️ Reached ${maxWarns}/${maxWarns} warnings for sharing a status that mentions this group.`,
            mentions: [sender],
          });
          database.clearWarnings(from, sender);
        } catch (e) { console.error('[AGM] Kick after max warns failed:', e.message); }
      } else {
        await sock.sendMessage(from, {
          text: `🛡️ @${senderNum} warned ⚠️\n\n📌 Reason: Shared a status that mentions this group\n⚠️ Warnings: ${warnData.count}/${maxWarns}\n\n_${maxWarns - warnData.count} more warning(s) before removal._`,
          mentions: [sender],
        });
      }

    } else if (action === 'kick') {
      try {
        await sock.sendMessage(from, { delete: msg.key });
        await sock.groupParticipantsUpdate(from, [sender], 'remove');
        await sock.sendMessage(from, {
          text: `🛡️ @${senderNum} has been removed for sharing a status that mentions this group.`,
          mentions: [sender],
        });
      } catch (e) { console.error('[AGM] Kick failed:', e.message); }

    } else {
      // delete (default)
      try {
        await sock.sendMessage(from, { delete: msg.key });
        await sock.sendMessage(from, {
          text: `🛡️ @${senderNum}'s message was deleted.\n📌 Reason: Sharing a status that mentions this group is not allowed here.`,
          mentions: [sender],
        });
      } catch (e) { console.error('[AGM] Delete failed:', e.message); }
    }

  } catch (error) {
    console.error('[AGM] Handler error:', error.message);
  }
};


const handleAntigroupstatus = async (sock, msg, groupMetadata) => {
  try {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const groupSettings = database.getGroupSettings(from);

    if (!groupSettings.antigroupstatus) return;

    let isStatusMention = false;

    if (msg.message) {
      isStatusMention = isStatusMention || !!msg.message.groupStatusMentionMessage;
      isStatusMention = isStatusMention ||
        (msg.message.protocolMessage && msg.message.protocolMessage.type === 25);

      const checkCtx = (ctx) => {
        if (!ctx) return false;
        if (ctx.forwardedNewsletterMessageInfo) return true;
        if (ctx.externalAdReplyInfo?.sourceType === 'status') return true;
        return false;
      };

      if (msg.message.extendedTextMessage?.contextInfo)
        isStatusMention = isStatusMention || checkCtx(msg.message.extendedTextMessage.contextInfo);
      if (msg.message.imageMessage?.contextInfo)
        isStatusMention = isStatusMention || checkCtx(msg.message.imageMessage.contextInfo);
      if (msg.message.videoMessage?.contextInfo)
        isStatusMention = isStatusMention || checkCtx(msg.message.videoMessage.contextInfo);
      if (msg.message.contextInfo)
        isStatusMention = isStatusMention || checkCtx(msg.message.contextInfo);
    }

    if (!isStatusMention) return;

    const senderIsAdmin = await isAdmin(sock, sender, from, groupMetadata);
    const senderIsOwner = isOwner(sender);
    if (senderIsAdmin || senderIsOwner) return;

    const botIsAdmin = await isBotAdmin(sock, from, groupMetadata);
    if (!botIsAdmin) return;

    const action = (groupSettings.antigroupstatusAction || 'delete').toLowerCase();
    const senderNum = sender.split('@')[0];

    if (action === 'warn') {
      const warnData = database.addWarning(from, sender, 'Status mention in group');
      const maxWarns = config.maxWarnings || 3;
      try {
        await sock.sendMessage(from, { delete: msg.key });
      } catch (_) {}
      if (warnData.count >= maxWarns) {
        try {
          await sock.groupParticipantsUpdate(from, [sender], 'remove');
          await sock.sendMessage(from, {
            text: `🛡️ @${senderNum} has been removed.\n⚠️ Reached ${maxWarns}/${maxWarns} warnings for posting status mentions.`,
            mentions: [sender],
          });
          database.clearWarnings(from, sender);
        } catch (e) {
          console.error('Failed to kick for antigroupstatus warn:', e);
        }
      } else {
        await sock.sendMessage(from, {
          text: `🛡️ @${senderNum} warned ⚠️\n\n📌 Reason: Status mention in group\n⚠️ Warnings: ${warnData.count}/${maxWarns}\n\n_${maxWarns - warnData.count} more warning(s) before removal._`,
          mentions: [sender],
        });
      }
    } else if (action === 'kick') {
      try {
        await sock.sendMessage(from, { delete: msg.key });
        await sock.groupParticipantsUpdate(from, [sender], 'remove');
        await sock.sendMessage(from, {
          text: `🛡️ @${senderNum} has been removed for posting a status mention.`,
          mentions: [sender],
        });
      } catch (e) {
        console.error('Failed to kick for antigroupstatus:', e);
      }
    } else {
      try {
        await sock.sendMessage(from, { delete: msg.key });
        await sock.sendMessage(from, {
          text: `🛡️ Status mention by @${senderNum} deleted.\n_Status mentions are not allowed in this group._`,
          mentions: [sender],
        });
      } catch (e) {
        console.error('Failed to delete for antigroupstatus:', e);
      }
    }
  } catch (error) {
    console.error('Error in antigroupstatus handler:', error);
  }
};

// Anti-call feature initializer
const initializeAntiCall = (sock) => {
  sock.ev.on('messages.update', async (updates) => {
    try {
      const { WAMessageStubType } = require('@whiskeysockets/baileys');

      // Handle deletions
      const revokeUpdates = updates.filter(
        item => item.update?.messageStubType === WAMessageStubType.REVOKE
      );
      if (revokeUpdates.length) {
        const antidelete = commands.get('antidelete');
        if (antidelete?.handleDelete) await antidelete.handleDelete(sock, revokeUpdates);

        // Status deletions
        const antideletestatus = commands.get('antideletestatus');
        if (antideletestatus?.handleStatusDelete) await antideletestatus.handleStatusDelete(sock, revokeUpdates);
      }

      // Handle edits
      const editUpdates = updates.filter(
        item => item.update?.message?.editedMessage || item.update?.message?.protocolMessage?.editedMessage
      );
      if (editUpdates.length) {
        const antiedit = commands.get('antiedit');
        if (antiedit?.handleAntiEdit) await antiedit.handleAntiEdit(sock, editUpdates);
      }
    } catch (_) {}
  });

  // Anti-call feature — decline/block incoming calls
  sock.ev.on('call', async (calls) => {
    try {
      // Reload config to get fresh settings
      delete require.cache[require.resolve('./config')];
      const config = require('./config');

      if (!config.defaultGroupSettings.anticall) return;

      const action = config.defaultGroupSettings.anticallAction || 'block';

      for (const call of calls) {
        if (call.status === 'offer') {
          // Decline the call
          await sock.rejectCall(call.id, call.from);

          // Block the caller if action is 'block' or 'on'
          if (action === 'block') {
            await sock.updateBlockStatus(call.from, 'block');

            // Notify user
            await sock.sendMessage(call.from, {
              text: '🚫 Calls are not allowed. You have been blocked.'
            });
          }
        }
      }
    } catch (err) {
      console.error('[ANTICALL ERROR]', err);
    }
  });
};

const handleAntiMedia = async (sock, msg, groupMetadata) => {
  try {
    const from   = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const groupSettings = database.getGroupSettings(from);

    // ── Resolve real media type through all Baileys wrappers ────────────────
    function resolveType(message) {
      if (!message) return null;
      const top = Object.keys(message)[0];
      if (!top) return null;
      const wrappers = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',
        'documentWithCaptionMessage',
      ];
      if (wrappers.includes(top)) {
        const inner = message[top]?.message;
        return inner ? Object.keys(inner)[0] : top;
      }
      return top;
    }

    const msgType = resolveType(msg.message);

    // GIF detection: videoMessage with gifPlayback === true
    const isGif = (() => {
      const vm = msg.message?.videoMessage ||
                 msg.message?.ephemeralMessage?.message?.videoMessage ||
                 msg.message?.viewOnceMessageV2?.message?.videoMessage;
      return !!(vm?.gifPlayback);
    })();

    const checks = [
      { enabled: groupSettings.antiimage,   action: groupSettings.antiimageAction   || 'delete', label: 'Anti Image 🖼️',    types: ['imageMessage'] },
      { enabled: groupSettings.antisticker, action: groupSettings.antistickerAction || 'delete', label: 'Anti Sticker 🎭',  types: ['stickerMessage'] },
      { enabled: groupSettings.antiaudio,   action: groupSettings.antiaudioAction   || 'delete', label: 'Anti Audio 🔇',    types: ['audioMessage', 'pttMessage'] },
      { enabled: groupSettings.anticontact, action: groupSettings.anticontactAction || 'delete', label: 'Anti Contact 📇',  types: ['contactMessage', 'contactsArrayMessage'] },
      { enabled: groupSettings.antigif && isGif, action: groupSettings.antigifAction || 'delete', label: 'Anti GIF 🎞️',    types: ['videoMessage'] },
    ];

    for (const check of checks) {
      if (!check.enabled) continue;
      if (!check.types.includes(msgType)) continue;

      const senderIsAdmin    = await isAdmin(sock, sender, from, groupMetadata);
      const senderIsOwnerChk = isOwner(sender);
      if (senderIsAdmin || senderIsOwnerChk) return;

      const botIsAdminChk = await isBotAdmin(sock, from, groupMetadata);
      if (!botIsAdminChk) return;

      // ── Delete the message ─────────────────────────────────────────────────
      const deleteKey = {
        remoteJid:   from,
        fromMe:      msg.key.fromMe || false,
        id:          msg.key.id,
        participant: msg.key.participant || undefined,
      };
      try { await sock.sendMessage(from, { delete: deleteKey }); } catch (_) {}

      const senderNum = sender.split('@')[0].split(':')[0];
      const divider   = '━━━━━━━━━━━━━━━━━━━━';

      // ── Fetch all group members for group-wide @mention ────────────────────
      let allMembers = [];
      try {
        const meta = groupMetadata || await sock.groupMetadata(from);
        allMembers = (meta?.participants || []).map(p => p.id);
      } catch (_) {}

      if (check.action === 'kick') {
        try {
          await sock.groupParticipantsUpdate(from, [sender], 'remove');
          await sock.sendMessage(from, {
            text:
              `${check.label}\n${divider}\n` +
              `🚫 @${senderNum} has been *removed* from this group.\n` +
              `📌 Reason: Sending ${check.label.replace(/Anti | 🖼️| 🎭| 🔇/g, '').trim().toLowerCase()} is not allowed here.\n` +
              `${divider}`,
            mentions: allMembers,
          });
        } catch (_) {}

      } else if (check.action === 'warn') {
        const result   = database.addWarning(from, sender, check.label);
        const maxWarns = config.maxWarnings || 3;

        if (result.count >= maxWarns) {
          try {
            await sock.groupParticipantsUpdate(from, [sender], 'remove');
            database.clearWarnings(from, sender);
            await sock.sendMessage(from, {
              text:
                `${check.label}\n${divider}\n` +
                `🚫 @${senderNum} has been *removed* from this group.\n` +
                `📌 Reason: Reached maximum warnings (${maxWarns}/${maxWarns}) for sending ${check.label.replace(/Anti | 🖼️| 🎭| 🔇/g, '').trim().toLowerCase()}.\n` +
                `${divider}`,
              mentions: allMembers,
            });
          } catch (_) {}
        } else {
          // Build warning pips e.g. ⚠️⚠️⬜ for 2/3
          const pips = '⚠️'.repeat(result.count) + '⬜'.repeat(maxWarns - result.count);
          await sock.sendMessage(from, {
            text:
              `${check.label}\n${divider}\n` +
              `⚠️ *WARNING* issued to @${senderNum}\n\n` +
              `📌 Reason: Sending ${check.label.replace(/Anti | 🖼️| 🎭| 🔇/g, '').trim().toLowerCase()} is not allowed in this group.\n\n` +
              `${pips}\n` +
              `Warnings: *${result.count}/${maxWarns}*\n\n` +
              `_${maxWarns - result.count} more warning(s) will result in removal._\n` +
              `${divider}`,
            mentions: allMembers,
          });
        }

      } else {
        // delete-only mode
        await sock.sendMessage(from, {
          text:
            `${check.label}\n${divider}\n` +
            `🗑️ @${senderNum}'s message was deleted.\n` +
            `📌 Sending ${check.label.replace(/Anti | 🖼️| 🎭| 🔇/g, '').trim().toLowerCase()} is not allowed here.\n` +
            `${divider}`,
          mentions: allMembers,
        });
      }
      return;
    }
  } catch (error) {
    console.error('Error in antiMedia handler:', error);
  }
};

// ── AntiBug crash-pattern detection ─────────────────────────────────────────
const CRASH_PATTERNS = [
  /\u0000/,
  /\u202E{2,}/,
  /[\u200B-\u200D\uFEFF]{10,}/,
  /[\u0300-\u036f]{8,}/,
  /(.)\1{500,}/,
  /[\u{E0000}-\u{E007F}]/u,
];

const isCrashMessage = (text) => {
  if (!text || typeof text !== 'string') return false;
  for (const p of CRASH_PATTERNS) {
    try { if (p.test(text)) return true; } catch (_) {}
  }
  return false;
};

// ── AntiBug handler — called for every incoming message ─────────────────────
const handleAntibug = async (sock, msg, groupMetadata, isGroup, sender, from) => {
  try {
    if (!database.getBotSetting('antibug')) return;
    if (msg.key.fromMe) return;

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.documentMessage?.caption || '';

    if (!isCrashMessage(text)) return;

    const senderNum = (sender || from).split('@')[0].split(':')[0];
    const action    = database.getBotSetting('antibugAction') || 'delete';


    if (isGroup) {
      const senderIsAdminVal = await isAdmin(sock, sender, from, groupMetadata);
      const senderIsOwnerVal = isOwner(sender);
      if (senderIsAdminVal || senderIsOwnerVal) return;

      const botIsAdminVal = await isBotAdmin(sock, from, groupMetadata);

      if (!botIsAdminVal) {
        // Cannot delete — leave group to protect bot
        try { await sock.groupLeave(from); } catch (_) {}
        try {
          const botJid = getSelfJid(sock);
          await sock.sendMessage(botJid, {
            text:
              `🛡️ *AntiBug Alert*\n` +
              `Left group *${groupMetadata?.subject || from}*\n` +
              `Reason: crash message detected from *${senderNum}* but bot is not admin.`
          });
        } catch (_) {}
        return;
      }

      // Bot is admin — delete message then take action
      try { await sock.sendMessage(from, { delete: msg.key }); } catch (_) {}

      if (action === 'kick') {
        try {
          await sock.groupParticipantsUpdate(from, [sender], 'remove');
          await sock.sendMessage(from, {
            text: `🛡️ *AntiBug* — @${senderNum} was *removed* for sending a crash message.`,
            mentions: [sender]
          });
        } catch (_) {}

      } else if (action === 'warn') {
        const result   = database.addWarning(from, sender, 'Crash message (AntiBug)');
        const maxWarns = config.maxWarnings || 3;
        if (result.count >= maxWarns) {
          try {
            await sock.groupParticipantsUpdate(from, [sender], 'remove');
            database.clearWarnings(from, sender);
            await sock.sendMessage(from, {
              text:
                `🛡️ *AntiBug* — @${senderNum} was *removed*.\n` +
                `Reached max warnings (${maxWarns}/${maxWarns}) for crash messages.`,
              mentions: [sender]
            });
          } catch (_) {}
        } else {
          await sock.sendMessage(from, {
            text:
              `🛡️ *AntiBug* ⚠️ Warning to @${senderNum}\n` +
              `Crash message deleted. Warnings: *${result.count}/${maxWarns}*`,
            mentions: [sender]
          });
        }

      } else {
        // delete-only
        try {
          await sock.sendMessage(from, {
            text: `🛡️ *AntiBug* — Crash message from @${senderNum} deleted.`,
            mentions: [sender]
          });
        } catch (_) {}
      }

    } else {
      // DM — block sender + notify bot's own number
      try { await sock.updateBlockStatus(sender, 'block'); } catch (_) {}
      try {
        const botJid = getSelfJid(sock);
        await sock.sendMessage(botJid, {
          text:
            `🛡️ *AntiBug Alert — DM*\n` +
            `Blocked *${senderNum}* for sending a crash/bug message in private chat.`
        });
      } catch (_) {}
    }
  } catch (e) {
    console.error('[ANTIBUG]', e.message);
  }
};

module.exports = {
  handleMessage,
  handleGroupUpdate,
  handleAntilink,
  handleAntibadword,
  handleAntigroupmention,
  handleAntigroupstatus,
  handleAntiMedia,
  handleAntibug,
  initializeAntiCall,
  isOwner,
  isAdmin,
  isBotAdmin,
  isMod,
  isSudo,
  getGroupMetadata,
  findParticipant,
  getCommandCount: () => commands.size
};

import { getPhoneFromLid } from '../../lib/sudo-store.js';
import { getOwnerName } from '../../lib/menuHelper.js';
import axios from 'axios';
import { REMOTE_URLS } from '../../lib/remoteUrls.js';

const FALLBACK_NUMBERS = ['254703397679', '254713046497', '254733961184', '254785471416'];
const CACHE_TTL_MS = 10 * 60 * 1000; // refresh every 10 minutes

let _devNumbers = [...FALLBACK_NUMBERS];
let _devEmoji   = '🐺';
let _lastFetch  = 0;

async function _fetchFrom(url) {
    const res  = await axios.get(url, { timeout: 8000 });
    const data = res.data;
    if (data && Array.isArray(data.developers) && data.developers.length > 0) {
        return data;
    }
    return null;
}

async function refreshDevList() {
    const { primary, fallback } = REMOTE_URLS.devNumbers;
    let data = null;
    try { data = await _fetchFrom(primary); } catch {}
    if (!data && fallback && fallback !== primary) {
        try { data = await _fetchFrom(fallback); } catch {}
    }
    if (data) {
        _devNumbers = data.developers
            .map(d => String(d.number || '').trim())
            .filter(Boolean);
        if (data.emoji) _devEmoji = data.emoji;
    }
    _lastFetch = Date.now();
}

refreshDevList();

function extractNumber(jid) {
    if (!jid) return '';
    return jid.replace(/[:@].*/g, '');
}

function isDevJid(jid) {
    if (!jid) return false;
    const number = extractNumber(jid);
    if (_devNumbers.includes(number)) return true;
    if (jid.includes('@lid')) {
        const resolved = globalThis.resolvePhoneFromLid?.(jid)
            || globalThis.lidPhoneCache?.get(number)
            || getPhoneFromLid(number);
        if (resolved && _devNumbers.includes(extractNumber(resolved))) return true;
    }
    return false;
}

export async function handleReactDev(sock, msg) {
    try {
        if (!msg?.key || !msg.message) return;
        if (msg.message.reactionMessage) return;

        const ts = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : 0;
        if (ts > 0 && Date.now() - ts > 30000) return;

        const remoteJid = msg.key.remoteJid || '';
        if (remoteJid === 'status@broadcast') return;
        if (msg.key.fromMe) return;

        if (Date.now() - _lastFetch > CACHE_TTL_MS) refreshDevList();

        let senderJid = '';
        if (remoteJid.endsWith('@g.us')) {
            const meta = globalThis.groupMetadataCache?.get(remoteJid);
            if (meta?.announce) return;
            senderJid = msg.key.participant || '';
        } else {
            senderJid = remoteJid;
        }

        if (!senderJid) return;
        if (!isDevJid(senderJid)) return;

        await sock.sendMessage(remoteJid, {
            react: { text: _devEmoji, key: msg.key }
        });
    } catch {}
}

export default {
    name: 'reactdev',
    alias: ['devreact'],
    category: 'automation',
    description: 'Auto-react to developer messages with a wolf emoji',
    ownerOnly: true,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        await refreshDevList();
        const { primary, fallback } = REMOTE_URLS.devNumbers;
        const devList = _devNumbers.map(n => `│ • +${n}`).join('\n');
        return await sock.sendMessage(chatId, {
            text: `╭─⌈ 🐺 *REACT DEV* ⌋\n│\n│ Status: ✅ ALWAYS ACTIVE\n│ Emoji: ${_devEmoji}\n│\n│ *Source URLs:*\n│ • Primary: ${primary}\n│ • Fallback: ${fallback}\n│\n│ *Developers:*\n${devList}\n│\n│ _Auto-reacts to developer\n│ messages in open groups & DMs_\n╰⊷ *Powered by ${getOwnerName().toUpperCase()} TECH*`
        });
    }
};
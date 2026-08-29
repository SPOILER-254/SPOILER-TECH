// commands/autosavestatus.js
// Auto save status updates from watched contacts and forward to owner's DM silently

const fs   = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');
const settings = require('../settings');

const DATA_FILE = path.join(__dirname, '../data/autosavestatus.json');

// ── Data helpers ──────────────────────────────────────────────────────────────

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const def = { enabled: false, contacts: [] };
            fs.writeFileSync(DATA_FILE, JSON.stringify(def, null, 2));
            return def;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (_) {
        return { enabled: false, contacts: [] };
    }
}

function saveData(data) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Normalize number to JID ───────────────────────────────────────────────────

function toJid(input) {
    // Already a JID
    if (input.includes('@s.whatsapp.net')) return input;
    // Strip non-digits
    const num = input.replace(/\D/g, '');
    return `${num}@s.whatsapp.net`;
}

function toNumber(jid) {
    return jid.replace('@s.whatsapp.net', '');
}

// ── Get owner JID ─────────────────────────────────────────────────────────────

function getOwnerJid() {
    const ownerNum = settings.ownerNumber ||
                     (Array.isArray(settings.owner) ? settings.owner[0] : settings.owner) || '';
    const num = ownerNum.toString().replace(/\D/g, '');
    return num ? `${num}@s.whatsapp.net` : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Command handler
// ─────────────────────────────────────────────────────────────────────────────

async function autosavestatusCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner  = message.key.fromMe || (await isOwnerOrSudo(senderId));
    const fake     = createFakeContact(message);
    const prefix   = getPrefix();

    if (!isOwner) {
        await sock.sendMessage(chatId, {
            text: '❌ This command is only for the owner!'
        }, { quoted: fake });
        return;
    }

    const data   = loadData();
    const action = args[0]?.toLowerCase();

    // ── No args → show status ─────────────────────────────────────────────────
    if (!action) {
        const statusIcon = data.enabled ? 'On ✅' : 'Off ❌';
        const count      = data.contacts.length;

        let text = `╭─[ *Auto Save Status* ]\n`;
        text += `┃❏ *Status:* ${statusIcon}\n`;
        text += `┃❏ *Watching:* ${count} contact${count !== 1 ? 's' : ''}\n`;
        text += `╰━────────━\n\n`;
        text += `*Commands:*\n`;
        text += `• \`${prefix}autosavestatus on\` — Enable\n`;
        text += `• \`${prefix}autosavestatus off\` — Disable\n`;
        text += `• \`${prefix}autosavestatus list\` — View contacts\n`;
        text += `• \`${prefix}autosavestatus add <number>\` — Add contact\n`;
        text += `• \`${prefix}autosavestatus remove <number>\` — Remove contact\n`;
        text += `• \`${prefix}autosavestatus clear\` — Remove all contacts\n\n`;
        text += `_Status updates are forwarded to your DM silently._`;

        await sock.sendMessage(chatId, { text }, { quoted: fake });
        return;
    }

    // ── on ────────────────────────────────────────────────────────────────────
    if (action === 'on') {
        data.enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, {
            text: `✅ Auto Save Status is now *ON*\n_Bot will silently save and forward status updates from watched contacts._`
        }, { quoted: fake });
        return;
    }

    // ── off ───────────────────────────────────────────────────────────────────
    if (action === 'off') {
        data.enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, {
            text: `❌ Auto Save Status is now *OFF*`
        }, { quoted: fake });
        return;
    }

    // ── list ──────────────────────────────────────────────────────────────────
    if (action === 'list') {
        if (data.contacts.length === 0) {
            await sock.sendMessage(chatId, {
                text: `📋 Watch list is empty.\n\nAdd contacts with:\n\`${prefix}autosavestatus add <number>\``
            }, { quoted: fake });
            return;
        }

        let text = `╭─[ *Watch List* ]\n`;
        data.contacts.forEach((jid, i) => {
            const num  = toNumber(jid);
            const name = data.names?.[jid] || num;
            text += `┃${i + 1}. ${name} (+${num})\n`;
        });
        text += `╰━────────━\n`;
        text += `_${data.contacts.length} contact${data.contacts.length !== 1 ? 's' : ''} being watched_`;

        await sock.sendMessage(chatId, { text }, { quoted: fake });
        return;
    }

    // ── add <number> ──────────────────────────────────────────────────────────
    if (action === 'add') {
        const input = args[1];
        if (!input) {
            await sock.sendMessage(chatId, {
                text: `❌ Please provide a number.\n\nUsage: \`${prefix}autosavestatus add 254712345678\``
            }, { quoted: fake });
            return;
        }

        const jid = toJid(input);

        if (data.contacts.includes(jid)) {
            await sock.sendMessage(chatId, {
                text: `ℹ️ *+${toNumber(jid)}* is already in the watch list.`
            }, { quoted: fake });
            return;
        }

        // Try to get contact name
        let displayName = toNumber(jid);
        try {
            const result = await sock.onWhatsApp(jid);
            if (result?.[0]?.notify) displayName = result[0].notify;
        } catch (_) {}

        data.contacts.push(jid);
        if (!data.names) data.names = {};
        data.names[jid] = displayName;
        saveData(data);

        await sock.sendMessage(chatId, {
            text: `✅ Added *${displayName}* (+${toNumber(jid)}) to watch list.\n_Their status updates will be forwarded to you silently._`
        }, { quoted: fake });
        return;
    }

    // ── remove <number or index> ──────────────────────────────────────────────
    if (action === 'remove' || action === 'rm') {
        const input = args[1];
        if (!input) {
            await sock.sendMessage(chatId, {
                text: `❌ Please provide a number or list index.\n\nUsage: \`${prefix}autosavestatus remove 254712345678\``
            }, { quoted: fake });
            return;
        }

        let jid = null;

        // Check if input is a list index number
        const idx = parseInt(input);
        if (!isNaN(idx) && idx >= 1 && idx <= data.contacts.length) {
            jid = data.contacts[idx - 1];
        } else {
            jid = toJid(input);
        }

        const pos = data.contacts.indexOf(jid);
        if (pos === -1) {
            await sock.sendMessage(chatId, {
                text: `❌ *+${toNumber(jid)}* is not in the watch list.`
            }, { quoted: fake });
            return;
        }

        const name = data.names?.[jid] || toNumber(jid);
        data.contacts.splice(pos, 1);
        if (data.names) delete data.names[jid];
        saveData(data);

        await sock.sendMessage(chatId, {
            text: `✅ Removed *${name}* from watch list.`
        }, { quoted: fake });
        return;
    }

    // ── clear ─────────────────────────────────────────────────────────────────
    if (action === 'clear') {
        const count    = data.contacts.length;
        data.contacts  = [];
        data.names     = {};
        saveData(data);

        await sock.sendMessage(chatId, {
            text: `✅ Watch list cleared. Removed *${count}* contact${count !== 1 ? 's' : ''}.`
        }, { quoted: fake });
        return;
    }

    // ── Unknown ───────────────────────────────────────────────────────────────
    await sock.sendMessage(chatId, {
        text: `❌ Unknown option: *${action}*\n\nType \`${prefix}autosavestatus\` for help.`
    }, { quoted: fake });
}

// ─────────────────────────────────────────────────────────────────────────────
// Status update handler — called from index.js / handleStatus
// ─────────────────────────────────────────────────────────────────────────────

async function handleAutoSaveStatus(sock, status) {
    try {
        const data = loadData();
        if (!data.enabled || data.contacts.length === 0) return;

        // status.messages is an array
        const messages = status.messages || [];

        for (const msg of messages) {
            if (!msg?.message) continue;

            const senderJid = msg.key?.participant || msg.key?.remoteJid || '';

            // Normalize — status JID is like 254712345678@s.whatsapp.net
            const normalizedSender = senderJid.includes(':')
                ? senderJid.split(':')[0] + '@s.whatsapp.net'
                : senderJid;

            // Check if this sender is in watch list
            const isWatched = data.contacts.some(jid =>
                jid === normalizedSender ||
                jid.split('@')[0] === normalizedSender.split('@')[0]
            );

            if (!isWatched) continue;

            // Get owner JID to forward to
            const ownerJid = getOwnerJid();
            if (!ownerJid) continue;

            const senderNum  = normalizedSender.split('@')[0];
            const senderName = data.names?.[normalizedSender] || senderNum;

            // Silently read the status (mark as viewed)
            try {
                await sock.readMessages([msg.key]);
            } catch (_) {}

            // ── Forward the status content to owner DM ────────────────────────
            const msgContent = msg.message;
            const caption    = `_Status from *${senderName}* (+${senderNum})_`;

            try {
                if (msgContent.imageMessage) {
                    // Image status
                    const buffer = await sock.downloadMediaMessage(msg);
                    await sock.sendMessage(ownerJid, {
                        image:   buffer,
                        caption: `${msgContent.imageMessage.caption || ''}\n\n${caption}`.trim()
                    });

                } else if (msgContent.videoMessage) {
                    // Video status
                    const buffer = await sock.downloadMediaMessage(msg);
                    await sock.sendMessage(ownerJid, {
                        video:   buffer,
                        caption: `${msgContent.videoMessage.caption || ''}\n\n${caption}`.trim()
                    });

                } else if (msgContent.extendedTextMessage || msgContent.conversation) {
                    // Text status
                    const text = msgContent.extendedTextMessage?.text ||
                                 msgContent.conversation || '';
                    await sock.sendMessage(ownerJid, {
                        text: `${text}\n\n${caption}`
                    });

                } else if (msgContent.audioMessage) {
                    // Audio/voice status
                    const buffer = await sock.downloadMediaMessage(msg);
                    await sock.sendMessage(ownerJid, {
                        audio:    buffer,
                        mimetype: 'audio/mp4',
                        caption:  caption
                    });
                }
            } catch (sendErr) {
                console.error('AutoSaveStatus: Failed to forward status:', sendErr.message);
            }
        }
    } catch (err) {
        console.error('AutoSaveStatus handler error:', err.message);
    }
}

module.exports = {
    autosavestatusCommand,
    handleAutoSaveStatus
};

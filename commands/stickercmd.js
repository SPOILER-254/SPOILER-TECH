// commands/stickercmd.js
const fs   = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

const DATA_FILE = path.join(__dirname, '../data/stickercmds.json');

// ── Data helpers ──────────────────────────────────────────────────────────────

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (_) {
        return {};
    }
}

function saveData(data) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Get sticker SHA256 as unique key ─────────────────────────────────────────

function getStickerKey(message) {
    const sticker = message.message?.stickerMessage ||
                    message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
    if (!sticker) return null;
    return sticker.fileSha256
        ? Buffer.from(sticker.fileSha256).toString('hex')
        : sticker.fileEncSha256
            ? Buffer.from(sticker.fileEncSha256).toString('hex')
            : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// .stickercmd handler
// ─────────────────────────────────────────────────────────────────────────────

async function stickercmdCommand(sock, chatId, message, args) {
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

    // ── No args → list all sticker commands ───────────────────────────────────
    if (!action || action === 'list') {
        const entries = Object.entries(data);

        if (entries.length === 0) {
            await sock.sendMessage(chatId, {
                text: `╭─[ *Sticker Commands* ]\n` +
                      `┃❏ No sticker commands set yet.\n` +
                      `╰━────────━\n\n` +
                      `*Set one by replying to a sticker:*\n` +
                      `\`${prefix}setstickercmd <command>\`\n\n` +
                      `_Example: reply to a sticker with_\n` +
                      `\`${prefix}setstickercmd play\``
            }, { quoted: fake });
            return;
        }

        let text = `╭─[ *Sticker Commands* ]\n`;
        text += `┃❏ *Total:* ${entries.length}\n`;
        text += `┃\n`;
        entries.forEach(([key, val], i) => {
            text += `┃${i + 1}. *${prefix}${val.command}*\n`;
            text += `┃   Key: \`${key.slice(0, 16)}...\`\n`;
            if (val.setAt) {
                text += `┃   Set: ${new Date(val.setAt).toLocaleString()}\n`;
            }
        });
        text += `╰━────────━\n\n`;
        text += `*Manage:*\n`;
        text += `• \`${prefix}stickercmd remove <command>\` — Remove by command name\n`;
        text += `• \`${prefix}stickercmd removeall\` — Remove all\n`;
        text += `• Reply to sticker + \`${prefix}stickercmd remove\` — Remove that sticker`;

        await sock.sendMessage(chatId, { text }, { quoted: fake });
        return;
    }

    // ── remove <command> or reply to sticker ──────────────────────────────────
    if (action === 'remove' || action === 'rm') {
        const entries = Object.entries(data);

        // Check if replying to a sticker
        const quotedSticker = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
        if (quotedSticker) {
            const stickerMsg = {
                message: {
                    extendedTextMessage: {
                        contextInfo: {
                            quotedMessage: { stickerMessage: quotedSticker }
                        }
                    }
                }
            };
            const key = getStickerKey(stickerMsg);
            if (key && data[key]) {
                const cmd = data[key].command;
                delete data[key];
                saveData(data);
                await sock.sendMessage(chatId, {
                    text: `✅ Removed sticker alias for *${prefix}${cmd}*`
                }, { quoted: fake });
                return;
            }
            await sock.sendMessage(chatId, {
                text: `❌ That sticker has no command set.`
            }, { quoted: fake });
            return;
        }

        // Remove by command name
        const cmdName = args[1]?.toLowerCase().replace(/^\./, '');
        if (!cmdName) {
            await sock.sendMessage(chatId, {
                text: `❌ Please provide a command name or reply to a sticker.\n\nUsage: \`${prefix}stickercmd remove <command>\``
            }, { quoted: fake });
            return;
        }

        const entry = entries.find(([, val]) => val.command === cmdName);
        if (!entry) {
            await sock.sendMessage(chatId, {
                text: `❌ No sticker alias found for *${prefix}${cmdName}*`
            }, { quoted: fake });
            return;
        }

        delete data[entry[0]];
        saveData(data);
        await sock.sendMessage(chatId, {
            text: `✅ Removed sticker alias for *${prefix}${cmdName}*`
        }, { quoted: fake });
        return;
    }

    // ── removeall ─────────────────────────────────────────────────────────────
    if (action === 'removeall' || action === 'clear') {
        const count = Object.keys(data).length;
        if (count === 0) {
            await sock.sendMessage(chatId, {
                text: `ℹ️ No sticker commands to remove.`
            }, { quoted: fake });
            return;
        }
        saveData({});
        await sock.sendMessage(chatId, {
            text: `✅ Removed all *${count}* sticker command${count !== 1 ? 's' : ''}.`
        }, { quoted: fake });
        return;
    }

    // ── Unknown ───────────────────────────────────────────────────────────────
    await sock.sendMessage(chatId, {
        text: `❌ Unknown option: *${action}*\n\nType \`${prefix}stickercmd\` for help.`
    }, { quoted: fake });
}

// ─────────────────────────────────────────────────────────────────────────────
// exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    stickercmdCommand,
    getStickerKey,
    loadStickerCmds: loadData
};

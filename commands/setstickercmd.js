// commands/setstickercmd.js
// Reply to a sticker with .setstickercmd <command> to set it as alias
const fs   = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');
const { getStickerKey, loadStickerCmds } = require('./stickercmd');

const DATA_FILE = path.join(__dirname, '../data/stickercmds.json');

function saveData(data) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function setstickercmdCommand(sock, chatId, message, args) {
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

    // Must be a reply to a sticker
    const quotedSticker = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;

    if (!quotedSticker) {
        await sock.sendMessage(chatId, {
            text: `❌ Please *reply to a sticker* with this command.\n\n` +
                  `Usage:\n_Reply to a sticker with_ \`${prefix}setstickercmd <command>\`\n\n` +
                  `Example:\n_Reply to sticker →_ \`${prefix}setstickercmd play\``
        }, { quoted: fake });
        return;
    }

    // Get command name from args
    let cmdName = args[0]?.toLowerCase().replace(/^\./, '').trim();

    if (!cmdName) {
        await sock.sendMessage(chatId, {
            text: `❌ Please provide a command name.\n\nExample: \`${prefix}setstickercmd play\``
        }, { quoted: fake });
        return;
    }

    // Get sticker unique key
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

    if (!key) {
        await sock.sendMessage(chatId, {
            text: `❌ Could not identify this sticker. Try another one.`
        }, { quoted: fake });
        return;
    }

    // Load existing data
    const data = loadStickerCmds();

    // Check if this sticker already has a command
    if (data[key]) {
        const existing = data[key].command;
        if (existing === cmdName) {
            await sock.sendMessage(chatId, {
                text: `ℹ️ This sticker is already set to *${prefix}${cmdName}*`
            }, { quoted: fake });
            return;
        }
        // Overwrite
        await sock.sendMessage(chatId, {
            text: `⚠️ This sticker was set to *${prefix}${existing}*\nUpdating to *${prefix}${cmdName}*...`
        }, { quoted: fake });
    }

    // Check if command already has a different sticker
    const existing = Object.entries(data).find(([, val]) => val.command === cmdName);
    if (existing && existing[0] !== key) {
        // Remove old sticker mapping for this command
        delete data[existing[0]];
    }

    // Save new mapping
    data[key] = {
        command: cmdName,
        setAt:   Date.now()
    };
    saveData(data);

    await sock.sendMessage(chatId, {
        text: `✅ Sticker set as alias for *${prefix}${cmdName}*\n\n` +
              `_Send that sticker anytime to run_ \`${prefix}${cmdName}\``
    }, { quoted: fake });
}

module.exports = setstickercmdCommand;

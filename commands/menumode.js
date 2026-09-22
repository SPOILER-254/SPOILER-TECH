// commands/menumode.js
const { getMenuSettings, saveMenuSettings, MENU_MODES } = require('./menuSettings');
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

const VALID_MODES = ['not_forwarded', 'forwarded', 'numbers'];

const MODE_DISPLAY = {
    'not_forwarded': 'Not Forwarded',
    'forwarded':     'Forwarded',
    'numbers':       'Numbers'
};

const MODE_DESC = {
    'not_forwarded': 'Normal menu — no forwarded tag',
    'forwarded':     'Menu appears as forwarded from a channel',
    'numbers':       'Shows numbered categories — reply with a number to view commands'
};

async function menumodeCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner  = message.key.fromMe || (await isOwnerOrSudo(senderId));
    const prefix   = getPrefix();
    const fake     = createFakeContact(message);

    if (!isOwner) {
        await sock.sendMessage(chatId, {
            text: '❌ This command is only available for the owner!'
        }, { quoted: fake });
        return;
    }

    const settings = getMenuSettings();
    const current  = settings.menuMode || 'not_forwarded';

    // ── No args → show status & help ────────────────────────────────────────
    if (!args || args.length === 0) {
        let text = `╭❐ *Menu Mode Settings*\n`;
        text += `┃◆ *Current mode:* ${MODE_DISPLAY[current]}\n`;
        text += `╰❐\n\n`;
        text += `*Available modes:*\n`;
        for (const [key, label] of Object.entries(MODE_DISPLAY)) {
            const active = key === current ? ' ✅' : '';
            text += `• *${label}*${active} — ${MODE_DESC[key]}\n`;
        }
        text += `\n*Usage:*\n`;
        text += `• \`${prefix}menumode not_forwarded\`\n`;
        text += `• \`${prefix}menumode forwarded\`\n`;
        text += `• \`${prefix}menumode numbers\`\n`;
        text += `\n*Forwarded channel commands:*\n`;
        text += `• \`${prefix}setforwarded channel <name>\`\n`;
        text += `• \`${prefix}setforwarded channel reset\``;

        await sock.sendMessage(chatId, { text }, { quoted: fake });
        return;
    }

    // ── Set mode ─────────────────────────────────────────────────────────────
    const newMode = args[0].toLowerCase().replace(/-/g, '_');

    if (!VALID_MODES.includes(newMode)) {
        await sock.sendMessage(chatId, {
            text: `❌ Invalid mode: *${args[0]}*\n\nValid modes: ${VALID_MODES.join(', ')}`
        }, { quoted: fake });
        return;
    }

    if (newMode === current) {
        await sock.sendMessage(chatId, {
            text: `ℹ️ Menu mode is already set to *${MODE_DISPLAY[newMode]}*`
        }, { quoted: fake });
        return;
    }

    settings.menuMode = newMode;
    saveMenuSettings(settings);

    let confirmText = `✅ Menu mode set to *${MODE_DISPLAY[newMode]}*\n\n`;
    confirmText += `_${MODE_DESC[newMode]}_`;

    // Extra hint for forwarded mode
    if (newMode === 'forwarded') {
        const ch = settings.forwardedChannel || '[ Brooz-D Tech ]';
        confirmText += `\n\n*Current channel name:* ${ch}`;
        confirmText += `\nChange it with \`${prefix}setforwarded channel <name>\``;
    }

    // Extra hint for numbers mode
    if (newMode === 'numbers') {
        confirmText += `\n\n_Menu styles 1–6 still apply to numbers mode._`;
    }

    await sock.sendMessage(chatId, { text: confirmText }, { quoted: fake });
}

module.exports = menumodeCommand;
// commands/setforwarded.js
const { getMenuSettings, saveMenuSettings } = require('./menuSettings');
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

async function setforwardedCommand(sock, chatId, message, args) {
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

    // ── No args → show help ──────────────────────────────────────────────────
    if (!args || args.length === 0) {
        const current = settings.forwardedChannel || '[ Adevos-X Tech ]';
        let text = `╭❐ *Forwarded Channel Settings*\n`;
        text += `┃◆ *Current channel:* ${current}\n`;
        text += `╰❐\n\n`;
        text += `*Usage:*\n`;
        text += `• \`${prefix}setforwarded channel <name>\` — Set channel name\n`;
        text += `• \`${prefix}setforwarded channel reset\` — Reset to default\n\n`;
        text += `_This name appears on the forwarded tag when menu mode is set to_ *Forwarded*.\n`;
        text += `_Set menu mode with_ \`${prefix}menumode forwarded\``;

        await sock.sendMessage(chatId, { text }, { quoted: fake });
        return;
    }

    const subCommand = args[0]?.toLowerCase();

    // ── setforwarded channel <name|reset> ────────────────────────────────────
    if (subCommand === 'channel') {
        if (!args[1]) {
            await sock.sendMessage(chatId, {
                text: `❌ Please provide a channel name.\n\nUsage:\n• \`${prefix}setforwarded channel <name>\`\n• \`${prefix}setforwarded channel reset\``
            }, { quoted: fake });
            return;
        }

        // Reset
        if (args[1].toLowerCase() === 'reset') {
            settings.forwardedChannel = '[ Adevos-X Tech ]';
            saveMenuSettings(settings);
            await sock.sendMessage(chatId, {
                text: `✅ Forwarded channel name reset to default: *Adevos-X Tech*`
            }, { quoted: fake });
            return;
        }

        // Set new name (allow multi-word names)
        const newName = args.slice(1).join(' ').trim();

        if (newName.length > 60) {
            await sock.sendMessage(chatId, {
                text: `❌ Channel name is too long. Maximum 60 characters.`
            }, { quoted: fake });
            return;
        }

        settings.forwardedChannel = newName;
        saveMenuSettings(settings);

        let confirmText = `✅ Forwarded channel name set to: *${newName}*`;

        // Warn if menuMode is not forwarded
        if ((settings.menuMode || 'not_forwarded') !== 'forwarded') {
            confirmText += `\n\n⚠️ Note: Menu mode is currently *${settings.menuMode || 'not_forwarded'}*.\nSwitch to forwarded mode with \`${prefix}menumode forwarded\` to use this.`;
        }

        await sock.sendMessage(chatId, { text: confirmText }, { quoted: fake });
        return;
    }

    // ── Unknown sub-command ──────────────────────────────────────────────────
    await sock.sendMessage(chatId, {
        text: `❌ Unknown option: *${subCommand}*\n\nUsage:\n• \`${prefix}setforwarded channel <name>\`\n• \`${prefix}setforwarded channel reset\``
    }, { quoted: fake });
}

module.exports = setforwardedCommand;

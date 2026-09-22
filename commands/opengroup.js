// commands/opengroup.js
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

async function opengroupCommand(sock, chatId, message, args) {
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

    // ── No args: open current group ───────────────────────────────────────────
    if (!args || args.length === 0) {
        const isGroup = chatId.endsWith('@g.us');
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: `❌ Please provide a group ID or use this command inside a group.\n\n` +
                      `Usage:\n• \`${prefix}open\` _(inside a group)_\n` +
                      `• \`${prefix}open <groupId>\``
            }, { quoted: fake });
            return;
        }
        await openGroup(sock, chatId, chatId, fake);
        return;
    }

    // ── First arg is a group JID ──────────────────────────────────────────────
    const targetJid = args[0].includes('@g.us') ? args[0] : `${args[0]}@g.us`;
    await openGroup(sock, chatId, targetJid, fake);
}

async function openGroup(sock, replyChatId, targetGroupJid, fake) {
    try {
        let groupName = targetGroupJid;
        try {
            const meta = await sock.groupMetadata(targetGroupJid);
            groupName  = meta.subject || targetGroupJid;
        } catch (_) {}

        // Open the group (everyone can send)
        await sock.groupSettingUpdate(targetGroupJid, 'not_announcement');

        await sock.sendMessage(replyChatId, {
            text: `✅ Group *${groupName}* has been *opened* 🔓\n_Everyone can send messages now._`
        }, { quoted: fake });

        // Notify the group itself if command came from elsewhere
        if (replyChatId !== targetGroupJid) {
            try {
                await sock.sendMessage(targetGroupJid, {
                    text: `🔓 This group has been opened.\n_Everyone can now send messages._`
                });
            } catch (_) {}
        }

    } catch (err) {
        let errMsg = err.message || 'Unknown error';
        if (errMsg.includes('not-authorized') || errMsg.includes('forbidden')) {
            errMsg = 'Bot is not an admin in that group.';
        }
        await sock.sendMessage(replyChatId, {
            text: `❌ Failed to open group: ${errMsg}`
        }, { quoted: fake });
    }
}

module.exports = opengroupCommand;

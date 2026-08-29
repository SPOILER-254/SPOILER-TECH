// commands/broadcast.js
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

async function broadcastCommand(sock, chatId, message, args) {
    const senderId  = message.key.participant || message.key.remoteJid;
    const isOwner   = message.key.fromMe || (await isOwnerOrSudo(senderId));
    const prefix    = getPrefix();
    const fake      = createFakeContact(message);

    if (!isOwner) {
        await sock.sendMessage(chatId, {
            text: '❌ This command is only for the owner!'
        }, { quoted: fake });
        return;
    }

    if (!args || args.length === 0) {
        await sock.sendMessage(chatId, {
            text: `╭❐ *Broadcast Command*\n` +
                  `┃\n` +
                  `┃ *Send to ALL groups:*\n` +
                  `┃ \`${prefix}broadcast <message>\`\n` +
                  `┃\n` +
                  `┃ *Send to ONE group:*\n` +
                  `┃ \`${prefix}broadcast <groupId> <message>\`\n` +
                  `┃\n` +
                  `┃ *Example (all groups):*\n` +
                  `┃ \`${prefix}broadcast Hello everyone!\`\n` +
                  `┃\n` +
                  `┃ *Example (one group):*\n` +
                  `┃ \`${prefix}broadcast 1234567890-1234@g.us Hello!\`\n` +
                  `╰❐`
        }, { quoted: fake });
        return;
    }

    // ── Detect if first arg is a group JID ────────────────────────────────────
    const isGroupJid = args[0].includes('@g.us') ||
                       /^\d{5,}-\d+@g\.us$/.test(args[0]) ||
                       /^\d+@g\.us$/.test(args[0]);

    let targetGroupId = null;
    let broadcastText = '';

    if (isGroupJid) {
        targetGroupId = args[0];
        broadcastText = args.slice(1).join(' ').trim();
    } else {
        broadcastText = args.join(' ').trim();
    }

    if (!broadcastText) {
        await sock.sendMessage(chatId, {
            text: `❌ Please provide a message to broadcast.\n\nUsage:\n• \`${prefix}broadcast <message>\`\n• \`${prefix}broadcast <groupId> <message>\``
        }, { quoted: fake });
        return;
    }

    // ── Get groups ────────────────────────────────────────────────────────────
    let groups = [];
    try {
        const allChats = await sock.groupFetchAllParticipating();
        groups = Object.values(allChats);
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to fetch groups: ${err.message}`
        }, { quoted: fake });
        return;
    }

    if (groups.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ Bot is not in any groups.`
        }, { quoted: fake });
        return;
    }

    // ── Single group mode ─────────────────────────────────────────────────────
    if (targetGroupId) {
        const group = groups.find(g => g.id === targetGroupId);
        if (!group) {
            await sock.sendMessage(chatId, {
                text: `❌ Group not found: *${targetGroupId}*\n\nMake sure the bot is in that group.`
            }, { quoted: fake });
            return;
        }

        try {
            await sock.sendMessage(targetGroupId, { text: broadcastText });
            await sock.sendMessage(chatId, {
                text: `✅ Broadcast sent to *${group.subject || targetGroupId}*`
            }, { quoted: fake });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to send to *${group.subject || targetGroupId}*: ${err.message}`
            }, { quoted: fake });
        }
        return;
    }

    // ── All groups mode ───────────────────────────────────────────────────────
    const total   = groups.length;
    let sent      = 0;
    let failed    = 0;
    const failedGroups = [];

    // Notify owner that broadcast is starting
    await sock.sendMessage(chatId, {
        text: `📢 Starting broadcast to *${total}* groups...\n_Please wait..._`
    }, { quoted: fake });

    for (const group of groups) {
        try {
            await sock.sendMessage(group.id, { text: broadcastText });
            sent++;
            // Small delay to avoid rate limiting (800ms per message)
            await new Promise(r => setTimeout(r, 800));
        } catch (err) {
            failed++;
            failedGroups.push(group.subject || group.id);
        }
    }

    // Summary
    let summary = `✅ *Broadcast Complete!*\n\n`;
    summary += `📊 *Results:*\n`;
    summary += `• Total groups: *${total}*\n`;
    summary += `• Sent: *${sent}* ✅\n`;
    summary += `• Failed: *${failed}* ❌\n`;

    if (failedGroups.length > 0 && failedGroups.length <= 10) {
        summary += `\n*Failed groups:*\n`;
        failedGroups.forEach(g => { summary += `• ${g}\n`; });
    } else if (failedGroups.length > 10) {
        summary += `\n_${failedGroups.length} groups failed (too many to list)_`;
    }

    await sock.sendMessage(chatId, { text: summary }, { quoted: fake });
}

module.exports = broadcastCommand;

// commands/listgroups.js
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

async function listgroupsCommand(sock, chatId, message) {
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

    await sock.sendMessage(chatId, {
        text: '🔍 Scanning your groups...'
    }, { quoted: fake });

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
            text: '❌ Bot is not in any groups.'
        }, { quoted: fake });
        return;
    }

    // Get bot's own JID
    const botJid = sock.user?.id?.replace(/:\d+/, '') + '@s.whatsapp.net';

    // Build list — send in chunks of 10 to avoid message size limit
    const chunkSize = 10;
    const chunks    = [];

    for (let i = 0; i < groups.length; i += chunkSize) {
        chunks.push(groups.slice(i, i + chunkSize));
    }

    for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        let text = c === 0
            ? `╭─[ *Group List* ] (${groups.length} total)\n┃\n`
            : `╭─[ *Group List* ] (continued)\n┃\n`;

        for (let i = 0; i < chunk.length; i++) {
            const g       = chunk[i];
            const gNum    = c * chunkSize + i + 1;
            const name    = g.subject || 'Unknown';
            const jid     = g.id;
            const members = g.participants?.length || 0;

            // Group status (open/closed)
            const announce = g.announce;
            const status   = announce ? 'Closed 🔒' : 'Opened 🔓';

            // Bot's role in this group
            const botParticipant = g.participants?.find(p =>
                p.id === botJid ||
                p.id?.split('@')[0] === botJid?.split('@')[0]
            );
            const myRole = botParticipant?.admin
                ? (botParticipant.admin === 'superadmin' ? 'Super Admin 👑' : 'Admin ⭐')
                : 'Member 👤';

            text += `┃ *${gNum}. ${name}*\n`;
            text += `┃   ◆ ID: \`${jid}\`\n`;
            text += `┃   ◆ Members: ${members}\n`;
            text += `┃   ◆ Status: ${status}\n`;
            text += `┃   ◆ Role: ${myRole}\n`;
            text += `┃\n`;
        }

        if (c === chunks.length - 1) {
            text += `╰❐\n\n`;
            text += `_Commands:_\n`;
            text += `• \`${prefix}close <id>\` — Close a group\n`;
            text += `• \`${prefix}open <id>\` — Open a group\n`;
            text += `• \`${prefix}broadcast <id> <msg>\` — Message a group\n`;
            text += `• \`${prefix}tagall <id>\` — Tag all in a group`;
        } else {
            text += `╰❐`;
        }

        await sock.sendMessage(chatId, { text }, { quoted: fake });

        // Small delay between chunks
        if (c < chunks.length - 1) {
            await new Promise(r => setTimeout(r, 600));
        }
    }
}

module.exports = listgroupsCommand;

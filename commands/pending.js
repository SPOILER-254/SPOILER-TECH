// commands/pending.js
// .pending — show pending join requests for the group
const isOwnerOrSudo = require('../lib/isOwner');
const isAdmin = require('../lib/isAdmin');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

// Format timestamp to "Xm ago", "Xh ago", "Xd ago"
function timeAgo(unixSeconds) {
    if (!unixSeconds) return null;
    const diffMs  = Date.now() - (unixSeconds * 1000);
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay > 0)  return `${diffDay}d ago`;
    if (diffHr > 0)   return `${diffHr}h ago`;
    if (diffMin > 0)  return `${diffMin}m ago`;
    return 'just now';
}

// Try all known field names Baileys may use for request time
function extractRequestTime(req) {
    return req.requestTime
        || req.request_time
        || req.ts
        || req.timestamp
        || req.addedTime
        || req.t
        || null;
}

async function pendingCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner  = message.key.fromMe || (await isOwnerOrSudo(senderId));
    const fake     = createFakeContact(message);
    const prefix   = getPrefix();
    const isGroup  = chatId.endsWith('@g.us');

    if (!isGroup) {
        await sock.sendMessage(chatId, {
            text: '❌ This command can only be used in groups.'
        }, { quoted: fake });
        return;
    }

    // Check if sender is admin or owner
    const adminStatus = await isAdmin(sock, chatId, senderId, message);
    if (!adminStatus.isSenderAdmin && !isOwner) {
        await sock.sendMessage(chatId, {
            text: '❌ Only group admins can view pending requests.'
        }, { quoted: fake });
        return;
    }

    if (!adminStatus.isBotAdmin) {
        await sock.sendMessage(chatId, {
            text: '❌ Bot must be an admin to view pending requests.'
        }, { quoted: fake });
        return;
    }

    // React
    await sock.sendMessage(chatId, {
        react: { text: '⏳', key: message.key }
    });

    try {
        const requests = await sock.groupRequestParticipantsList(chatId);

        if (!requests || requests.length === 0) {
            await sock.sendMessage(chatId, {
                text: `╭─[ *Pending Requests* ]\n` +
                      `┃❏ No pending join requests.\n` +
                      `╰━────────━`
            }, { quoted: fake });
            return;
        }

        // Build enriched list — same approach as approveCommand (fast, no external calls)
        const enriched = requests.map((req) => {
            const jid    = req.jid || req;
            const number = jid.split('@')[0];
            const rawTime = extractRequestTime(req);
            const time    = rawTime ? timeAgo(rawTime) : null;

            // Use name directly from req fields, fallback to number
            const name = req.name
                || req.notify
                || req.pushName
                || req.push_name
                || req.displayName
                || `+${number}`;

            return { name, time, number, jid };
        });

        // Build message
        let text = `╭─[ *Pending Join Requests* ]\n`;
        text += `┃❏ *Total:* ${enriched.length} request${enriched.length !== 1 ? 's' : ''}\n`;
        text += `┃\n`;

        enriched.forEach((entry, i) => {
            const timePart = entry.time ? ` · _${entry.time}_` : '';
            text += `┃*${i + 1}.* @${entry.number}${timePart}\n`;
        });

        text += `╰━────────━\n\n`;
        text += `*Actions:*\n`;
        text += `• \`${prefix}approve all\` — Approve all requests\n`;
        text += `• \`${prefix}approve @tag\` — Approve specific user`;

        await sock.sendMessage(chatId, {
            text,
            mentions: enriched.map(e => e.jid)  // WhatsApp ionyeshe usernames kwenye @mentions
        }, { quoted: fake });

    } catch (err) {
        if (err.message?.includes('not-supported') ||
            err.message?.includes('undefined') ||
            err.message?.includes('groupRequestParticipantsList')) {
            await sock.sendMessage(chatId, {
                text: `❌ This feature requires the group to have *Approval Mode* enabled.\n\n` +
                      `_Enable it: Group Settings → Membership Approval → On_`
            }, { quoted: fake });
        } else {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to fetch pending requests: ${err.message}`
            }, { quoted: fake });
        }
    }
}

module.exports = pendingCommand;
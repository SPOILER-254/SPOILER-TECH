// commands/tagallremote.js
// .tagall <groupId> — tag all members in any group, even without being admin
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

async function tagallremoteCommand(sock, chatId, message, args) {
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

    // ── Determine target group and optional message ───────────────────────────
    let targetJid   = null;
    let customMsg   = '';

    const isGroup = chatId.endsWith('@g.us');

    if (!args || args.length === 0) {
        // Inside a group — tag current group
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: `❌ Please provide a group ID or use this inside a group.\n\n` +
                      `Usage:\n• \`${prefix}tagall\` _(inside target group)_\n` +
                      `• \`${prefix}tagall <groupId>\`\n` +
                      `• \`${prefix}tagall <groupId> <message>\``
            }, { quoted: fake });
            return;
        }
        targetJid = chatId;
    } else {
        const firstArg = args[0];
        const isJid    = firstArg.includes('@g.us') || /^\d{5,}/.test(firstArg);

        if (isJid) {
            targetJid = firstArg.includes('@g.us') ? firstArg : `${firstArg}@g.us`;
            customMsg = args.slice(1).join(' ').trim();
        } else {
            // No JID — use current chat if group
            if (!isGroup) {
                await sock.sendMessage(chatId, {
                    text: `❌ Please provide a valid group ID.\n\nUsage: \`${prefix}tagall <groupId> <message>\``
                }, { quoted: fake });
                return;
            }
            targetJid = chatId;
            customMsg = args.join(' ').trim();
        }
    }

    // ── Fetch group metadata ──────────────────────────────────────────────────
    let meta;
    try {
        meta = await sock.groupMetadata(targetJid);
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to fetch group info: ${err.message}\n\nMake sure the bot is in that group.`
        }, { quoted: fake });
        return;
    }

    const participants = meta.participants || [];
    if (participants.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ No participants found in *${meta.subject}*`
        }, { quoted: fake });
        return;
    }

    const groupName = meta.subject || targetJid;
    const mentions  = participants.map(p => p.id);

    // Build tag message
    const tagMsg = customMsg
        ? `${customMsg}\n\n`
        : `[ *Attention everyone!* ]\n\n`;

    const memberList = mentions.map(jid => {
        const num = jid.split('@')[0];
        return `@${num}`;
    }).join(' ');

    const fullMsg = tagMsg + memberList;

    // ── Send to target group ──────────────────────────────────────────────────
    try {
        await sock.sendMessage(targetJid, {
            text:     fullMsg,
            mentions: mentions
        });

        // Confirm to owner if command was from a different chat
        if (chatId !== targetJid) {
            await sock.sendMessage(chatId, {
                text: `✅ Tagged *${mentions.length}* members in *${groupName}*`
            }, { quoted: fake });
        }
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to tag members in *${groupName}*: ${err.message}`
        }, { quoted: fake });
    }
}

module.exports = tagallremoteCommand;

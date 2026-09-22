const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

function toJid(input) {
    if (!input) return null;
    const s = String(input).trim();
    if (s.includes('@')) return s;
    const n = s.replace(/\D/g, '');
    return n.length >= 7 ? `${n}@s.whatsapp.net` : null;
}

async function getppCommand(sock, chatId, message) {
    const fake = createFakeContact(message);

    try {
        const ctx = message.message?.extendedTextMessage?.contextInfo
                 || message.message?.imageMessage?.contextInfo
                 || message.message?.videoMessage?.contextInfo
                 || {};

        const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = rawText.trim().split(/\s+/).slice(1);

        let targetUser = null;

        // 1) @mention / tag
        const mentioned = ctx?.mentionedJid || [];
        if (mentioned.length) targetUser = mentioned[0];

        // 2) Plain number argument
        if (!targetUser && args.length && args[0] && !args[0].startsWith('@')) {
            const jid = toJid(args[0]);
            if (jid) targetUser = jid;
        }

        // 3) Reply to a message
        if (!targetUser && ctx?.quotedMessage) {
            const p = ctx.participant || ctx.remoteJid;
            if (p && p !== 'status@broadcast') targetUser = p;
        }

        // 4) Default — sender themselves
        if (!targetUser) {
            targetUser = message.key.participant || message.key.remoteJid;
        }

        if (!targetUser) {
            return await sock.sendMessage(chatId, {
                text: `❌ Could not identify target user.\n\n` +
                      `*Usage:*\n` +
                      `• .getpp 254798570132 — by number\n` +
                      `• .getpp @user — tag a user\n` +
                      `• Reply to any message with .getpp\n` +
                      `• .getpp — show your own PP`
            }, { quoted: fake });
        }

        const num = targetUser.split('@')[0].split(':')[0];

        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(targetUser, 'image');
        } catch (e) {
            const code = e?.output?.statusCode;
            const m = (e?.message || '').toLowerCase();
            if (code === 401 || m.includes('forbidden') || m.includes('unauthorized')) {
                return await sock.sendMessage(chatId, {
                    text: `🔒 @${num}'s profile picture is private.`,
                    mentions: [targetUser]
                }, { quoted: fake });
            }
            if (code === 404 || code === 500 || m.includes('not found') || m.includes('item-not-found')) {
                return await sock.sendMessage(chatId, {
                    text: `❌ No profile picture set for @${num}.`,
                    mentions: [targetUser]
                }, { quoted: fake });
            }
            return await sock.sendMessage(chatId, {
                text: `❌ Could not fetch profile picture for @${num}.`,
                mentions: [targetUser]
            }, { quoted: fake });
        }

        if (!ppUrl) {
            return await sock.sendMessage(chatId, {
                text: `❌ No profile picture found for @${num}.`,
                mentions: [targetUser]
            }, { quoted: fake });
        }

        const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 30000 });
        const buffer = Buffer.from(res.data);

        await sock.sendMessage(chatId, {
            image: buffer,
            caption: `👤 Profile picture of @${num}`,
            mentions: [targetUser]
        }, { quoted: message });

    } catch (err) {
        console.error('[getpp] error:', err);
        try {
            await sock.sendMessage(chatId, { text: `❌ Profile picture not found for this user.` }, { quoted: fake });
        } catch (_) {}
    }
}

module.exports = getppCommand;
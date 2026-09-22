// commands/vv2.js
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { createFakeContact } = require('../lib/fakeContact');

async function vv2Command(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return await sock.sendMessage(chatId, { text: 'Reply to a viewonce message.' }, { quoted: createFakeContact(message) });
        }

        const quotedImage = quoted?.imageMessage || quoted?.viewOnceMessageV2?.message?.imageMessage || quoted?.viewOnceMessage?.message?.imageMessage;
        const quotedVideo = quoted?.videoMessage || quoted?.viewOnceMessageV2?.message?.videoMessage || quoted?.viewOnceMessage?.message?.videoMessage;
        const quotedAudio = quoted?.audioMessage || quoted?.viewOnceMessageV2?.message?.audioMessage || quoted?.viewOnceMessage?.message?.audioMessage;

        const downloadBuffer = async (msg, type) => {
            const stream = await downloadContentFromMessage(msg, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            return buffer;
        };

        const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        if (quotedImage && (quotedImage.viewOnce || quoted.viewOnceMessageV2 || quoted.viewOnceMessage)) {
            const buffer = await downloadBuffer(quotedImage, 'image');
            await sock.sendMessage(ownerJid, { 
                image: buffer, 
                caption: quotedImage.caption || '👁️ ViewOnce Image'
            });

        } else if (quotedVideo && (quotedVideo.viewOnce || quoted.viewOnceMessageV2 || quoted.viewOnceMessage)) {
            const buffer = await downloadBuffer(quotedVideo, 'video');
            await sock.sendMessage(ownerJid, { 
                video: buffer, 
                caption: quotedVideo.caption || '👁️ ViewOnce Video'
            });

        } else if (quotedAudio && (quotedAudio.viewOnce || quoted.viewOnceMessageV2 || quoted.viewOnceMessage)) {
            const buffer = await downloadBuffer(quotedAudio, 'audio');
            await sock.sendMessage(ownerJid, { 
                audio: buffer, 
                mimetype: quotedAudio.mimetype || 'audio/mp4'
            });

        } else {
            await sock.sendMessage(chatId, { text: 'Reply to a valid view-once media.' }, { quoted: createFakeContact(message) });
        }
    } catch (error) {
        console.error('VV2 Error:', error);
        await sock.sendMessage(chatId, { text: 'Failed to process viewonce message.' }, { quoted: createFakeContact(message) });
    }
}

// ── Auto-intercept: mtu aki reply viewonce kwa emoji yoyote ──────────────────
async function handleViewOnceReaction(sock, message) {
    try {
        // Angalia kama ni reply yenye emoji/text fupi (reaction-like)
        const text = message.message?.conversation?.trim() ||
                     message.message?.extendedTextMessage?.text?.trim() || '';

        // Emoji check — characters 1-3 tu (emoji moja au mbili)
        const isEmojiReply = text.length > 0 && text.length <= 3 && 
                             /\p{Emoji}/u.test(text);

        if (!isEmojiReply) return;

        // Angalia kama inareply viewonce
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return;

        const quotedImage = quoted?.viewOnceMessageV2?.message?.imageMessage || 
                            quoted?.viewOnceMessage?.message?.imageMessage ||
                            (quoted?.imageMessage?.viewOnce ? quoted.imageMessage : null);

        const quotedVideo = quoted?.viewOnceMessageV2?.message?.videoMessage || 
                            quoted?.viewOnceMessage?.message?.videoMessage ||
                            (quoted?.videoMessage?.viewOnce ? quoted.videoMessage : null);

        const quotedAudio = quoted?.viewOnceMessageV2?.message?.audioMessage || 
                            quoted?.viewOnceMessage?.message?.audioMessage ||
                            (quoted?.audioMessage?.viewOnce ? quoted.audioMessage : null);

        if (!quotedImage && !quotedVideo && !quotedAudio) return;

        const downloadBuffer = async (msg, type) => {
            const stream = await downloadContentFromMessage(msg, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            return buffer;
        };

        const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Tuma DM owner bila kujulisha mtu yeyote
        if (quotedImage) {
            const buffer = await downloadBuffer(quotedImage, 'image');
            await sock.sendMessage(ownerJid, {
                image: buffer,
                caption: quotedImage.caption || '👁️ ViewOnce Image (auto-intercepted)'
            });
        } else if (quotedVideo) {
            const buffer = await downloadBuffer(quotedVideo, 'video');
            await sock.sendMessage(ownerJid, {
                video: buffer,
                caption: quotedVideo.caption || '👁️ ViewOnce Video (auto-intercepted)'
            });
        } else if (quotedAudio) {
            const buffer = await downloadBuffer(quotedAudio, 'audio');
            await sock.sendMessage(ownerJid, {
                audio: buffer,
                mimetype: quotedAudio.mimetype || 'audio/mp4'
            });
        }

    } catch (_) {}
}

module.exports = { vv2Command, handleViewOnceReaction };
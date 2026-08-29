const { downloadContentFromMessage, generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
const fetch = require('node-fetch');

const { createFakeContact } = require('../lib/fakeContact');

async function convertStickerToImageSimple(stickerBuffer) {
    if (stickerBuffer.slice(0, 12).toString('hex').includes('52494646')) {
        console.log('Detected WebP sticker, using fallback conversion');
        return stickerBuffer; 
    }
    return stickerBuffer;
}

async function convertStickerToImage(stickerBuffer, mimetype = 'image/webp') {
    try {
        return await convertStickerToImageSimple(stickerBuffer);
    } catch (error) {
        console.error('Sticker conversion failed:', error);
        throw new Error(`Sticker conversion failed: ${error.message}`);
    }
}

async function setGroupStatusCommand(sock, chatId, msg) {
    try {
        const isGroup = chatId.endsWith('@g.us');
        if (!isGroup) {
            return sock.sendMessage(chatId, { text: 'Groups only!' }, { quoted: msg });
        }

        const participant = await sock.groupMetadata(chatId).then(metadata =>
            metadata.participants.find(p => p.id === msg.key.participant || p.id === msg.key.remoteJid)
        );
        const isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        const { isSudo: isSudoCheck } = require('../lib/index');
        const senderJid = msg.key.participant || msg.key.remoteJid;
        if (!isAdmin && !msg.key.fromMe && !(await isSudoCheck(senderJid))) {
            return sock.sendMessage(chatId, { text: 'Admins only!' }, { quoted: msg });
        }

        const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const commandRegex = /^[.!#/]?(togstatus|swgc|groupstatus|tosgroup)\s*/i;

        let textAfterCommand = '';
        if (messageText.trim()) {
            const match = messageText.match(commandRegex);
            if (match) textAfterCommand = messageText.slice(match[0].length).trim();
        }

        // FIX: Handle direct reply to text message
        let directReplyText = null;
        if (quotedMessage?.conversation) {
            directReplyText = quotedMessage.conversation;
        } else if (quotedMessage?.extendedTextMessage?.text) {
            directReplyText = quotedMessage.extendedTextMessage.text;
        }

        if (!quotedMessage && !textAfterCommand && !directReplyText) {
            return sock.sendMessage(chatId, { text: getHelpText() }, { quoted: msg });
        }

        let payload = null;

        if (quotedMessage) {
            // Check if replying to a text message (no media)
            if (directReplyText && !quotedMessage.imageMessage && !quotedMessage.videoMessage && !quotedMessage.audioMessage && !quotedMessage.stickerMessage) {
                payload = { text: directReplyText };
                if (textAfterCommand) {
                    payload.text = textAfterCommand;
                }
            } else {
                payload = await buildPayloadFromQuoted(quotedMessage);
                if (textAfterCommand && payload) {
                    if (payload.video || payload.image || (payload.convertedSticker && payload.image)) {
                        payload.caption = textAfterCommand;
                    } else if (payload.text) {
                        payload.text = textAfterCommand;
                    }
                }
            }
        } else if (textAfterCommand) {
            payload = { text: textAfterCommand };
        }

        if (!payload) {
            return sock.sendMessage(chatId, { text: getHelpText() }, { quoted: msg });
        }

        await sendGroupStatus(sock, chatId, payload);

        const mediaType = detectMediaType(quotedMessage, payload);
        let successMsg = `${mediaType} sent!`;
        if (payload.caption) successMsg += `\n📝 "${payload.caption}"`;
        if (payload.convertedSticker) successMsg += `\n✨ Sticker → Image`;
        if (payload.text && !payload.caption) successMsg += `\n📝 "${payload.text.slice(0, 50)}${payload.text.length > 50 ? '...' : ''}"`;

        await sock.sendMessage(chatId, { text: successMsg }, { quoted: msg });

    } catch (error) {
        console.error('Error in group status command:', error);
        await sock.sendMessage(chatId, { text: `Error: ${error.message}` }, { quoted: createFakeContact(msg) });
    }
}

function getHelpText() {
    return `
╭◆ *GROUP STATUS*
│
│Commands:
│◇ togroupstatus 
│◇ tosgroup
│◇ setgstatus
│
│Usage:
│◇ tosgroup text
│◇ Reply to text/media/sticker with .tosgroup
│◇ Add caption after command
│
│Example:
│◇ .tosgroup Hello everyone!
│◇ Reply to a message with .tosgroup
╰◆`;
}

async function buildPayloadFromQuoted(quotedMessage) {
    if (quotedMessage.videoMessage) {
        const buffer = await downloadToBuffer(quotedMessage.videoMessage, 'video');
        return { 
            video: buffer, 
            caption: quotedMessage.videoMessage.caption || '',
            gifPlayback: quotedMessage.videoMessage.gifPlayback || false,
            mimetype: quotedMessage.videoMessage.mimetype || 'video/mp4'
        };
    } else if (quotedMessage.imageMessage) {
        const buffer = await downloadToBuffer(quotedMessage.imageMessage, 'image');
        return { 
            image: buffer, 
            caption: quotedMessage.imageMessage.caption || '',
            mimetype: quotedMessage.imageMessage.mimetype || 'image/jpeg'
        };
    } else if (quotedMessage.audioMessage) {
        const buffer = await downloadToBuffer(quotedMessage.audioMessage, 'audio');
        if (quotedMessage.audioMessage.ptt) {
            const audioVn = await toVN(buffer);
            return { audio: audioVn, mimetype: "audio/ogg; codecs=opus", ptt: true };
        } else {
            return { audio: buffer, mimetype: quotedMessage.audioMessage.mimetype || 'audio/mpeg', ptt: false };
        }
    } else if (quotedMessage.stickerMessage) {
        try {
            const buffer = await downloadToBuffer(quotedMessage.stickerMessage, 'sticker');
            const imageBuffer = await convertStickerToImage(buffer, quotedMessage.stickerMessage.mimetype);
            return { 
                image: imageBuffer, 
                caption: quotedMessage.stickerMessage.caption || '',
                mimetype: 'image/png',
                convertedSticker: true,
                originalMimetype: quotedMessage.stickerMessage.mimetype
            };
        } catch (conversionError) {
            console.error('Sticker conversion failed:', conversionError);
            return { text: `Sticker conversion failed (${quotedMessage.stickerMessage.mimetype || 'unknown'})` };
        }
    }
    return null;
}

function detectMediaType(quotedMessage, payload = null) {
    if (!quotedMessage) {
        if (payload?.text) return 'Text';
        return 'Text';
    }
    if (quotedMessage.videoMessage) return 'Video';
    if (quotedMessage.imageMessage) return 'Image';
    if (quotedMessage.audioMessage) return 'Audio';
    if (quotedMessage.stickerMessage) {
        if (payload && payload.convertedSticker) return 'Sticker → Image';
        return 'Sticker';
    }
    if (quotedMessage.conversation || quotedMessage.extendedTextMessage?.text) return 'Text';
    return 'Text';
}

async function downloadToBuffer(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

async function sendGroupStatus(conn, jid, content) {
    const inside = await generateWAMessageContent(content, { upload: conn.waUploadToServer });
    const messageSecret = crypto.randomBytes(32);
    const m = generateWAMessageFromContent(jid, {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: { message: { ...inside, messageContextInfo: { messageSecret } } }
    }, {});
    await conn.relayMessage(jid, m.message, { messageId: m.key.id });
    return m;
}

async function toVN(inputBuffer) {
    return new Promise((resolve, reject) => {
        const inStream = new PassThrough();
        inStream.end(inputBuffer);
        const outStream = new PassThrough();
        const chunks = [];
        ffmpeg(inStream)
            .noVideo()
            .audioCodec("libopus")
            .format("ogg")
            .audioBitrate("48k")
            .audioChannels(1)
            .audioFrequency(48000)
            .on("error", reject)
            .on("end", () => resolve(Buffer.concat(chunks)))
            .pipe(outStream, { end: true });
        outStream.on("data", chunk => chunks.push(chunk));
    });
}

module.exports = setGroupStatusCommand;
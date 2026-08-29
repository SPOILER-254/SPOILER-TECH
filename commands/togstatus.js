const { downloadContentFromMessage, generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');

async function setGroupStatusCommand(sock, chatId, msg) {
    try {
        // Owner check
        if (!msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: '❌ Only the owner can use this command!' });
            return;
        }

        const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const commandRegex = /^[.!#/]?(togstatus|swgc|groupstatus)\s*/i;
        
        // Remove command and extract the rest
        const fullText = messageText.replace(commandRegex, '').trim();
        
        // Parse caption from full text using "|" as separator
        let caption = '';
        let textAfterCommand = fullText;
        
        // Check if there's a "|" in the text after command
        if (fullText.includes('|')) {
            const parts = fullText.split('|');
            const beforePipe = parts.shift();
            caption = parts.join('|').trim();
            textAfterCommand = beforePipe ? beforePipe.trim() : '';
        }
        
        // If there's no "|", check if there's text after command without "|"
        if (!fullText.includes('|') && fullText) {
            caption = fullText;
        }
        
        // Clean up caption
        caption = caption.replace(commandRegex, '').trim();

        let payload = {};

        // Handle quoted media
        if (quotedMessage) {
            if (quotedMessage.imageMessage) {
                const stream = await downloadContentFromMessage(quotedMessage.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                payload = { image: buffer, caption: caption || '' };
            } else if (quotedMessage.audioMessage) {
                const stream = await downloadContentFromMessage(quotedMessage.audioMessage, 'audio');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                const audioVn = await toVN(buffer);
                payload = { audio: audioVn, mimetype: "audio/ogg; codecs=opus", ptt: true };
                // Note: Audio messages don't support captions in status updates
            } else if (quotedMessage.stickerMessage) {
                const stream = await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                payload = { sticker: buffer };
            } else {
                payload = { text: caption || '' };
            }
        } else {
            payload = { text: caption || '' };
        }

        // Send group status - FIXED VERSION
        await sendGroupStatus(sock, chatId, payload);

        const mediaType = quotedMessage ? 
            (quotedMessage.imageMessage ? 'Image' : 
             quotedMessage.audioMessage ? 'Voice Note' : 
             quotedMessage.stickerMessage ? 'Sticker' : 'Text') : 'Text';

        await sock.sendMessage(chatId, { text: `✅ ${mediaType} status sent successfully!` + (caption ? `\n📝 Caption: "${caption}"` : '') });

    } catch (error) {
        console.error('Error in groupstatus command:', error);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` });
    }
}

async function sendGroupStatus(conn, jid, content) {
    try {
        // Generate message content
        const inside = await generateWAMessageContent(content, { upload: conn.waUploadToServer });
        const messageSecret = crypto.randomBytes(32);
        
        // Create the status message with proper structure
        const message = {
            groupStatusMessageV2: {
                message: {
                    ...inside,
                    messageContextInfo: { 
                        messageSecret: messageSecret 
                    }
                }
            },
            messageContextInfo: { 
                messageSecret: messageSecret 
            }
        };
        
        // Alternative: Try using simple status update if groupStatusMessageV2 fails
        const m = generateWAMessageFromContent(jid, message, {});
        
        // Send the message
        const result = await conn.relayMessage(jid, m.message, { 
            messageId: m.key.id 
        });
        
        console.log('Status sent successfully:', result);
        return m;
        
    } catch (error) {
        console.error('Error in sendGroupStatus:', error);
        
        // Fallback: Try sending as normal message if status update fails
        if (content.text) {
            await conn.sendMessage(jid, { text: content.text });
        } else if (content.image) {
            await conn.sendMessage(jid, { 
                image: content.image, 
                caption: content.caption 
            });
        } else if (content.audio) {
            await conn.sendMessage(jid, { 
                audio: content.audio, 
                mimetype: 'audio/ogg; codecs=opus', 
                ptt: true 
            });
        } else if (content.sticker) {
            await conn.sendMessage(jid, { sticker: content.sticker });
        }
        
        throw error;
    }
}

// Convert audio to voice note
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
            .on("error", (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            })
            .on("end", () => {
                const result = Buffer.concat(chunks);
                resolve(result);
            })
            .pipe(outStream, { end: true });

        outStream.on("data", chunk => chunks.push(chunk));
    });
}

module.exports = setGroupStatusCommand;
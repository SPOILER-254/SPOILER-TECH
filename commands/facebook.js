const axios = require('axios');
const { getBotName } = require('../lib/botConfig');
const { createFakeContact } = require('../lib/fakeContact');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function facebookCommand(sock, chatId, message) {
    try {
        // Prevent duplicate processing
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const fakeQuoted = createFakeContact(message);

        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "📱 *Facebook Video Downloader*\n\nPlease provide a Facebook link.\n\nExample: `.fb https://www.facebook.com/share/r/1KQ5GLGAtQ/`"
            }, { quoted: fakeQuoted });
        }

        const url = text.split(' ').slice(1).join(' ').trim();
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "📱 *Facebook Video Downloader*\n\nPlease provide a Facebook link.\n\nExample: `.fb https://www.facebook.com/share/r/1KQ5GLGAtQ/`"
            }, { quoted: fakeQuoted });
        }

        // Validate Facebook URL
        const fbPatterns = [
            /https?:\/\/(?:www\.)?facebook\.com\//,
            /https?:\/\/fb\.watch\//,
            /https?:\/\/m\.facebook\.com\//,
            /https?:\/\/web\.facebook\.com\//,
            /https?:\/\/(?:www\.)?facebook\.com\/share\//
        ];

        const isValidUrl = fbPatterns.some(pattern => pattern.test(url));
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { 
                text: "❌ That is not a valid Facebook link. Please provide a valid Facebook video link."
            }, { quoted: fakeQuoted });
        }

        await sock.sendMessage(chatId, {
            react: { text: '📥', key: message.key }
        });

        try {
            // ✅ WORKING Facebook download API (xhclinton)
            const apiResponse = await axios.get(
                `https://apiz.xhclinton.me/api/downloader/facebook?apikey=toxicapis&url=${encodeURIComponent(url)}`,
                { timeout: 30000 }
            );
            const data = apiResponse.data;

            if (data && data.success && data.download_url) {
                // Prefer HD if available, otherwise SD
                const videoUrl = data.download_url_hd || data.download_url;
                const title = data.title || 'Facebook Video';
                const uploader = data.uploader || 'Unknown';
                const duration = data.duration || '?';

                // Send thumbnail with info first (optional)
                if (data.thumbnail) {
                    await sock.sendMessage(chatId, {
                        image: { url: data.thumbnail },
                        caption: `🎬 *${title.substring(0, 100)}*\n👤 ${uploader}\n⏱️ ${duration} seconds\n\nDownloading video...`
                    }, { quoted: fakeQuoted });
                }

                // Send the video
                await sock.sendMessage(chatId, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: `✅ *${getBotName()}*\n📹 ${title.substring(0, 80)}`
                }, { quoted: fakeQuoted });

                await sock.sendMessage(chatId, {
                    react: { text: '✅', key: message.key }
                });

            } else {
                return await sock.sendMessage(chatId, {
                    text: "❌ Failed to fetch video. The link may be invalid or the video is private.\n\nPlease check the link and try again."
                }, { quoted: fakeQuoted });
            }

        } catch (error) {
            console.error('Error in Facebook API:', error.message || error);
            await sock.sendMessage(chatId, {
                text: "❌ Failed to download the Facebook video. The API may be down or the link is invalid.\n\nPlease try again later."
            }, { quoted: fakeQuoted });
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: message.key }
            });
        }
    } catch (error) {
        console.error('Error in facebookCommand:', error.message || error);
        await sock.sendMessage(chatId, {
            text: "❌ An unexpected error occurred. Please try again."
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = facebookCommand;
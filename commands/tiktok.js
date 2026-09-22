const axios = require('axios');
const { getBotName } = require('../lib/botConfig');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

const { createFakeContact } = require('../lib/fakeContact');

async function tiktokCommand(sock, chatId, message) {
    try {
        // Prevent duplicate processing
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const fakeQuoted = createFakeContact(message);

        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "📱 *TikTok Downloader*\n\nPlease provide a TikTok link!\n\n📝 *Usage:* .tt https://www.tiktok.com/@user/video/123456789"
            }, { quoted: fakeQuoted });
        }

        const url = text.split(' ').slice(1).join(' ').trim();
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "❌ Please provide a TikTok link after the command."
            }, { quoted: fakeQuoted });
        }

        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { 
                text: "❌ That is not a valid TikTok link. Please provide a valid TikTok video link."
            }, { quoted: fakeQuoted });
        }

        // React with downloading indicator
        await sock.sendMessage(chatId, {
            react: { text: '📥', key: message.key }
        });

        try {
            // Using working DrexApp API
            const apiResponse = await axios.get(
                `https://api.drexapp.space/downloader/tiktok?url=${encodeURIComponent(url)}`,
                { timeout: 30000 }
            );
            
            const data = apiResponse.data;

            if (data && data.status && data.result && data.result.result) {
                const videoData = data.result.result;
                const videoUrl = videoData.play; // No watermark video
                const watermarkUrl = videoData.wmplay; // With watermark (fallback)
                
                // Get video info
                const author = videoData.author;
                const stats = videoData;
                
                // Build caption
                let caption = `🎵 *TikTok Video*\n\n`;
                caption += `📌 *Title:* ${videoData.title || 'No title'}\n`;
                caption += `👤 *Author:* @${author.unique_id} (${author.nickname})\n`;
                caption += `⏱ *Duration:* ${videoData.duration} seconds\n`;
                caption += `❤️ *Likes:* ${stats.digg_count.toLocaleString()}\n`;
                caption += `💬 *Comments:* ${stats.comment_count.toLocaleString()}\n`;
                caption += `🔄 *Shares:* ${stats.share_count.toLocaleString()}\n`;
                caption += `📥 *Downloads:* ${stats.download_count.toLocaleString()}\n\n`;
                caption += `> Powered by DrexApp API`;
                
                // Send video (use watermark URL as fallback if no-watermark fails)
                const sendUrl = videoUrl || watermarkUrl;
                
                if (!sendUrl) {
                    throw new Error('No video URL found');
                }
                
                await sock.sendMessage(chatId, {
                    video: { url: sendUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: fakeQuoted });
                
                // Success reaction
                await sock.sendMessage(chatId, {
                    react: { text: '✅', key: message.key }
                });

            } else {
                return await sock.sendMessage(chatId, {
                    text: "❌ Failed to fetch video. The link might be invalid or expired.\n\n💡 Try:\n• Using a different TikTok link\n• Checking if the video is public\n• Trying again later"
                }, { quoted: fakeQuoted });
            }

        } catch (error) {
            console.error('Error in TikTok API:', error.message || error);
            
            // Try alternative API if first fails
            try {
                // Fallback to Clinton API (if available)
                const fallbackResponse = await axios.get(
                    `https://apiz.xhclinton.me/api/tiktok?apikey=toxicapis&url=${encodeURIComponent(url)}`,
                    { timeout: 30000 }
                );
                
                if (fallbackResponse.data?.success && fallbackResponse.data?.video_url) {
                    await sock.sendMessage(chatId, {
                        video: { url: fallbackResponse.data.video_url },
                        mimetype: "video/mp4",
                        caption: "🎵 *TikTok Video* (via Fallback API)"
                    }, { quoted: fakeQuoted });
                    
                    await sock.sendMessage(chatId, {
                        react: { text: '✅', key: message.key }
                    });
                    return;
                }
                throw new Error('Fallback also failed');
                
            } catch (fallbackError) {
                await sock.sendMessage(chatId, {
                    text: "❌ Failed to download the TikTok video. Please try again later.\n\nPossible issues:\n• API is temporarily down\n• Video is private/removed\n• Invalid TikTok link"
                }, { quoted: fakeQuoted });
                
                await sock.sendMessage(chatId, {
                    react: { text: '❌', key: message.key }
                });
            }
        }
    } catch (error) {
        console.error('Error in TikTok command:', error.message || error);
        await sock.sendMessage(chatId, {
            text: "❌ An unexpected error occurred. Please try again."
        }, { quoted: fakeQuoted });
    }
}

module.exports = tiktokCommand;

const yts = require('yt-search');
const axios = require('axios');

async function song2Command(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, {
            react: { text: "🎵", key: message.key }
        });
        
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text: "🎵 *Song Downloader*\n\nWhat song do you want to download?\n\nExample: `.song2 Not Like Us`"
            }, { quoted: message });
        }

        // Search for the song (for metadata only)
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: "❌ No songs found!"
            }, { quoted: message });
        }

        // Get the first video result for title
        const video = videos[0];
        const title = video.title;

        // Fetch audio data from DREX API (WORKING)
        const drexUrl = `https://api.drexapp.space/downloader/ytplay?q=${encodeURIComponent(searchQuery)}`;
        const response = await axios.get(drexUrl, { timeout: 30000 });
        const data = response.data;

        if (!data?.status || !data?.result?.download_url) {
            return await sock.sendMessage(chatId, { 
                text: "❌ Failed to fetch audio. Please try again later."
            }, { quoted: message });
        }

        const audioUrl = data.result.download_url;

        // Send the audio
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title.substring(0, 80)}.mp3`
        }, { quoted: message });
        
        // Success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error('Error in song2 command:', error);
        await sock.sendMessage(chatId, { 
            text: "❌ Download failed. Please try again later."
        }, { quoted: message });
        
        // Error reaction
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
    }
}

module.exports = song2Command;
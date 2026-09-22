const yts = require('yt-search');
const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        const fakekontak = createFakeContact(message);

        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text: "What song do you want to download?"
            }, { quoted: fakekontak });
        }

        // React
        await sock.sendMessage(chatId, {
            react: { text: "🎶", key: message.key }
        });

        // Search for the song (fallback if Drex fails)
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: "No songs found!"
            }, { quoted: fakekontak });
        }

        // Get the first video result
        const video = videos[0];
        const title = video.title;

        // Notify user about download
        await sock.sendMessage(chatId, { 
            text: `_Playing 🎵_\n_${title} 🎶_`
        }, { quoted: fakekontak });

        // Fetch audio data from DREX API (search directly)
        const response = await axios.get(
            `https://api.drexapp.space/downloader/ytplay?q=${encodeURIComponent(searchQuery)}`,
            {
                timeout: 35000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }
        );

        const data = response.data;

        if (!data || !data.status || !data.result?.download_url) {
            return await sock.sendMessage(chatId, { 
                text: "Failed to fetch audio from the API. Please try again later."
            }, { quoted: fakekontak });
        }

        const audioUrl = data.result.download_url;
        const audioTitle = data.result.title || title;

        // Send as audio (playable in chat)
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${audioTitle}.mp3`,
            caption: `🎵 *${audioTitle}*`
        }, { quoted: fakekontak });

        // Send also as document (downloadable file)
        await sock.sendMessage(chatId, {
            document: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${audioTitle}.mp3`,
            caption: `🎵 *${audioTitle}*`
        }, { quoted: fakekontak });

    } catch (error) {
        console.error('Error in songCommand:', error);
        await sock.sendMessage(chatId, { 
            text: "Download failed. Please try again later."
        }, { quoted: fakekontak });
    }
}

module.exports = songCommand;
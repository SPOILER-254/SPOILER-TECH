const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function spotifyCommand(sock, chatId, message) {
    try {
        const quoted = createFakeContact(message);

        // Initial reaction
        await sock.sendMessage(chatId, {
            react: { text: '🎵', key: message.key }
        });

        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || 
                     message.message?.imageMessage?.caption || 
                     '';

        if (!text.includes(' ')) {
            return await sock.sendMessage(chatId, {
                text: '🎵 *Music Downloader*\n\n❌ Please provide a song name!\n\n📝 *Usage:*\n.spotify Blinding Lights The Weeknd\n\n🔍 *Examples:*\n• .spotify Bohemian Rhapsody\n• .spotify Yesterday The Beatles'
            }, { quoted });
        }

        const parts = text.split(' ');
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '🎵 *Music Downloader*\n\n❌ Please provide a song name!\n\n📝 *Example:*\n.spotify Dance Monkey'
            }, { quoted });
        }

        if (query.length > 200) {
            return await sock.sendMessage(chatId, {
                text: '🎵 *Music Downloader*\n\n📝 Query too long! Max 200 characters.\n\n💡 Try a shorter song name.'
            }, { quoted });
        }

        // Presence update
        await sock.sendPresenceUpdate('recording', chatId);

        // ✅ Using WORKING Drex YouTube API
        const apiUrl = `https://api.drexapp.space/downloader/ytplay?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 60000 });

        const apiData = response.data;
        
        if (!apiData?.status || !apiData?.result?.download_url) {
            throw new Error('No download link found');
        }

        const dl = apiData.result.download_url;
        const title = apiData.result.title || query;
        const duration = apiData.result.duration || 'Unknown';
        const fileName = `${title.replace(/[^a-z0-9]/gi, '_').substring(0, 80)}.mp3`;

        // Success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

        // Send audio with fake contact quoted
        await sock.sendMessage(chatId, {
            audio: { url: dl },
            mimetype: 'audio/mpeg',
            fileName,
            caption: `🎵 *${title}*\n⏱️ Duration: ${duration}`
        }, { quoted });

        // Final reaction
        await sock.sendMessage(chatId, {
            react: { text: '🎧', key: message.key }
        });

    } catch (error) {
        const quoted = createFakeContact(message);
        console.error(`Music command error for query "${message.message?.conversation || ''}":`, error);

        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        let errorMessage;
        if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
            errorMessage = 'Download timed out! The song might be too long.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Cannot connect to music service!';
        } else if (error.response?.status === 429) {
            errorMessage = 'Too many download requests! Please wait a while.';
        } else if (error.message.includes('No download link')) {
            errorMessage = 'Song not found or cannot be downloaded!';
        } else {
            errorMessage = `Error: ${error.message}`;
        }

        await sock.sendMessage(chatId, {
            text: `🎵 *Music Downloader*\n\n🚫 ${errorMessage}\n\n💡 *Tips:*\n• Try a different song\n• Check the spelling\n• Try without special characters\n• Use exact song title`
        }, { quoted });
    }
}

module.exports = spotifyCommand;
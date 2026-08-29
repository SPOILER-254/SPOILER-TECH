const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, { 
            text: '🎤 *Lyrics Finder*\n\n❌ Please enter a song name!\n\n📝 *Usage:* .lyrics Faded Alan Walker\n\n🔍 *Examples:*\n• .lyrics Shape of You\n• .lyrics Bohemian Rhapsody'
        }, { quoted: createFakeContact(message) });
        return;
    }

    try {
        // Initial reaction
        await sock.sendMessage(chatId, {
            react: { text: '🎵', key: message.key }
        });

        // Using working DrexApp API (same one from your test)
        const res = await axios.get(`https://api.drexapp.space/search/lyrics?q=${encodeURIComponent(songTitle)}`, {
            timeout: 30000
        });
        
        const data = res.data;

        if (!data.status || !data.result || !data.result.lyrics) {
            await sock.sendMessage(chatId, { 
                text: `❌ No lyrics found for "${songTitle}".\n\n💡 Tips:\n• Check spelling\n• Try with artist name\n• Use a different song`
            }, { quoted: createFakeContact(message) });
            
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: message.key }
            });
            return;
        }

        const song = data.result;
        
        // Format the response with title, artist, and lyrics
        let caption = `🎶 *${song.title}*`;
        if (song.artist) caption += ` - ${song.artist}`;
        caption += `\n\n📝 *Lyrics:*\n\n${song.lyrics}`;

        // Send lyrics
        await sock.sendMessage(chatId, { 
            text: caption 
        }, { quoted: createFakeContact(message) });
        
        // Success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });
        
    } catch (error) {
        console.error('Error in lyrics command:', error);
        
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
        
        await sock.sendMessage(chatId, { 
            text: `❌ An error occurred while fetching lyrics for "${songTitle}".\n\nPlease try again later.`
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = { lyricsCommand };
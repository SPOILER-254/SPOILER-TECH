const yts = require('yt-search');
const { createFakeContact } = require('../lib/fakeContact');

async function ytsCommand(sock, chatId, senderId, message, userMessage) {
    try {
        const args = userMessage.split(' ').slice(1);
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '🔍 *YouTube Search Command*\n\nUsage:\n`.yts <search_query>`\n\nExample:\n`.yts Godzilla`\n`.yts latest songs`\n`.yts tutorial`'
            }, { quoted: createFakeContact(message) });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔍', key: message.key }
        });

        let searchResults;
        try {
            searchResults = await yts(query);
        } catch (searchError) {
            console.error('YouTube search error:', searchError);
            return await sock.sendMessage(chatId, {
                text: '❌ Error searching YouTube. Please try again later.'
            }, { quoted: createFakeContact(message) });
        }

        const videos = (searchResults && searchResults.videos) ? searchResults.videos.slice(0, 10) : [];

        if (videos.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `❌ No results found for "${query}"\n\nTry different keywords.`
            }, { quoted: createFakeContact(message) });
        }

        let resultMessage = `🎵 *YouTube Search:* "${query}"\n\n`;

        videos.forEach((video, index) => {
            const duration = video.timestamp || 'N/A';
            const views = video.views ? video.views.toLocaleString() : 'N/A';
            const uploadDate = video.ago || 'N/A';

            resultMessage += `${index + 1}. *${video.title}*\n`;
            resultMessage += `   🔗 ${video.url}\n`;
            resultMessage += `   ⏱️ ${duration} | 👁️ ${views} | 📅 ${uploadDate}\n`;
            resultMessage += `   📺 Channel: ${video.author?.name || 'N/A'}\n\n`;
        });

        resultMessage += `━━━━━━━━━━━━━━━━━\n`;
        resultMessage += `💡 *Tips:*\n`;
        resultMessage += `• Use \`.play ${query.substring(0, 30)}\` to play audio\n`;
        resultMessage += `• Use \`.song ${query.substring(0, 30)}\` to download`;

        // Get the first video's thumbnail
        const firstVideo = videos[0];
        const thumbnail = firstVideo.thumbnail || firstVideo.image || null;

        if (thumbnail) {
            await sock.sendMessage(chatId, { 
                image: { url: thumbnail },
                caption: resultMessage
            }, { quoted: createFakeContact(message) });
        } else {
            await sock.sendMessage(chatId, { 
                text: resultMessage 
            }, { quoted: createFakeContact(message) });
        }

        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (error) {
        console.error('YouTube search command error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred while searching YouTube. Please try again.'
        }, { quoted: createFakeContact(message) });
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
    }
}

module.exports = ytsCommand;
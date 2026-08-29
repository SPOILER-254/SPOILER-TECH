const axios = require('axios');

async function playdocCommand(sock, chatId, message) {
    try {
        // React to the command first
        await sock.sendMessage(chatId, {
            react: { text: "🎵", key: message.key }
        });

        // Extract query from message
        const q = message.message?.conversation || 
                  message.message?.extendedTextMessage?.text || 
                  message.message?.imageMessage?.caption || 
                  message.message?.videoMessage?.caption || '';
        
        const args = q.split(' ').slice(1);
        const query = args.join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '*🎵 Audio Player*\nPlease provide a song name.\n\nExample: `.playdoc Pop Smoke Woo Baby`'
            }, { quoted: message });
        }

        console.log('[PLAYDOC] Searching for:', query);

        // Use Drex API (same as playCommand)
        const apiUrl = `https://api.drexapp.space/downloader/ytplay?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 35000 });
        const data = response.data;

        if (!data?.status || !data?.result?.download_url) {
            return await sock.sendMessage(chatId, {
                text: '*❌ No Results Found*\nNo songs found for your query. Please try different keywords.'
            }, { quoted: message });
        }

        const title = data.result.title;
        const audioUrl = data.result.download_url;
        const safeTitle = title.replace(/[\\/:*?"<>|]/g, '');
        const fileName = `${safeTitle}.mp3`;

        // Send as document (downloadable file)
        await sock.sendMessage(chatId, {
            document: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: fileName,
            caption: `🎵 *${title}*`
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            react: { text: "✅", key: message.key }
        });

    } catch (err) {
        console.error('[PLAYDOC] Error:', err.message);
        await sock.sendMessage(chatId, {
            text: '*❌ Error Occurred*\nFailed to download. Please try again later.'
        }, { quoted: message });
        await sock.sendMessage(chatId, {
            react: { text: "❌", key: message.key }
        });
    }
}

module.exports = playdocCommand;
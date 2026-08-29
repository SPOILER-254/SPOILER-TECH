const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

/* =========================
   SAFE REQUEST WITH RETRY
========================= */
async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (i < attempts) {
                await new Promise(r => setTimeout(r, i * 1000));
            }
        }
    }
    throw lastError;
}

/* =========================
   DREX AUDIO DOWNLOADER
========================= */
async function getDrexDownload(query) {
    const apiUrl = `https://api.drexapp.space/downloader/ytplay?q=${encodeURIComponent(query)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));

    if (!res?.data?.status || !res?.data?.result?.download_url) {
        throw new Error('Drex API returned no download URL');
    }

    const result = res.data.result;
    
    return {
        download: result.download_url,
        title: result.title,
        thumbnail: result.thumbnail || 'https://img.youtube.com/vi/default/hqdefault.jpg',
        duration: result.duration || '0:00'
    };
}

/* =========================
   SONG COMMAND
========================= */
async function songCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        if (!text) {
            return sock.sendMessage(
                chatId,
                { text: '🎵 *Song Downloader*\n\nUsage: .song <song name or YouTube link>\n\nExample: .song Not Like Us' },
                { quoted: message }
            );
        }

        let video;
        let query;

        // If user pasted YouTube link
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
            const search = await yts(text);
            video = search?.videos?.[0] || {
                url: text,
                title: 'YouTube Audio',
                thumbnail: 'https://img.youtube.com/vi/default/hqdefault.jpg',
                timestamp: '0:00'
            };
            query = video.title;
        } else {
            // Search by name
            query = text;
            const search = await yts(text);
            if (!search?.videos?.length) {
                return sock.sendMessage(
                    chatId,
                    { text: '❌ No results found.' },
                    { quoted: message }
                );
            }
            video = search.videos[0];
        }

        // Send downloading message
        await sock.sendMessage(
            chatId,
            {
                text: `🎵 *Downloading Audio...*\n\n*Title:* ${video.title}\n*Duration:* ${video.timestamp || '0:00'}`
            },
            { quoted: message }
        );

        // Get download from Drex API
        const audio = await getDrexDownload(query);

        if (!audio?.download) {
            throw new Error('Download URL not found');
        }

        // SEND AUDIO
        await sock.sendMessage(
            chatId,
            {
                document: { url: audio.download },
                mimetype: "audio/mpeg",
                fileName: `${video.title.substring(0, 100)}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: 'YouTube Audio Download',
                        mediaType: 2,
                        thumbnailUrl: video.thumbnail,
                        mediaUrl: video.url,
                        sourceUrl: video.url,
                        showAdAttribution: true
                    }
                }
            },
            { quoted: message }
        );
        
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (err) {
        console.error('Song command error:', err);
        await sock.sendMessage(
            chatId,
            { text: `❌ Failed to download song:\n${err.message}` },
            { quoted: message }
        );
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
    }
}

module.exports = songCommand;
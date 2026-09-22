const fs = require("fs");
const axios = require('axios');
const yts = require('yt-search');
const path = require('path');

const { createFakeContact } = require('../lib/fakeContact');

// Updated working API for video (ytmp4)
const YTMP4_API = 'https://api.drexapp.space/downloader/ytmp4';

async function ytdocvideoCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, {
            react: { text: '🎬', key: message.key }
        });

        const tempDir = path.join(__dirname, "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const parts = text.split(' ');
        const query = parts.slice(1).join(' ').trim();

        if (!query) return await sock.sendMessage(chatId, {
            text: '🎬 Provide a YouTube link or Name\nExample:\n\nytdocvideo Not Like Us Music Video\nytdocvideo Espresso '
        }, { quoted: createFakeContact(message) });

        if (query.length > 100) return await sock.sendMessage(chatId, {
            text: `📝 Video name too long! Max 100 chars.`
        }, { quoted: createFakeContact(message) });

        // Search for video
        const searchResult = await (await yts(`${query}`)).videos[0];
        if (!searchResult) return sock.sendMessage(chatId, {
            text: " 🚫 Couldn't find that video. Try another one!"
        }, { quoted: createFakeContact(message) });

        const video = searchResult;
        const apiUrl = `${YTMP4_API}?url=${encodeURIComponent(video.url)}`;
        const response = await axios.get(apiUrl);
        const apiData = response.data;

        if (!apiData.status || !apiData.result || !apiData.result.downloadURL) {
            throw new Error("API failed to fetch video!");
        }

        const timestamp = Date.now();
        const fileName = `video_${timestamp}.mp4`;
        const filePath = path.join(tempDir, fileName);

        // Download MP4 video
        const videoResponse = await axios({
            method: "get",
            url: apiData.result.downloadURL,
            responseType: "stream",
            timeout: 600000,
            headers: {
                'Referer': 'https://youtube.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const writer = fs.createWriteStream(filePath);
        videoResponse.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            throw new Error("Video download failed or empty file!");
        }

        // Get file size
        const fileSize = fs.statSync(filePath).size;
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

        // Send as document (video)
        await sock.sendMessage(chatId, {
            document: { url: filePath },
            mimetype: "video/mp4",
            fileName: `${video.title.substring(0, 100)}.mp4`,
            caption: `*🎞️ YouTube Video Downloaded*\n\n*Title:* ${video.title}\n*Duration:* ${video.timestamp}\n*Channel:* ${video.author.name}\n*Size:* ${fileSizeMB} MB`
        }, { quoted: createFakeContact(message) });

        // Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("ytdocvideo command error:", error);
        
        let errorMessage = `🚫 Error: ${error.message}`;
        
        if (error.message.includes("timeout")) {
            errorMessage = "⏱️ Download timeout! Video might be too large.";
        } else if (error.message.includes("API failed")) {
            errorMessage = "🔧 API error! Try again in a few moments.";
        } else if (error.message.includes("empty file")) {
            errorMessage = "📭 Download failed! Video might not be available.";
        } else if (error.response?.status === 403) {
            errorMessage = "🔒 Download blocked. Try again later.";
        }
        
        return await sock.sendMessage(chatId, {
            text: errorMessage
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = ytdocvideoCommand;
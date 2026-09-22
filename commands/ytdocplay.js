const fs = require("fs");
const axios = require("axios");
const yts = require("yt-search");
const path = require("path");
const os = require("os");

const { createFakeContact } = require('../lib/fakeContact');

async function ytdocplayCommand(sock, chatId, message) {
    try { 
        await sock.sendMessage(chatId, {
            react: { text: "🎼", key: message.key }
        });
        
        // Use a safe temp directory
        const tempDir = path.join(__dirname, "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        } else {
            const stat = fs.statSync(tempDir);
            if (!stat.isDirectory()) {
                fs.unlinkSync(tempDir); // remove file named "temp"
                fs.mkdirSync(tempDir, { recursive: true });
            }
        }
        
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const parts = text.split(" ");
        const query = parts.slice(1).join(" ").trim();

        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: "🎵 *Audio Downloader*\n\n❌ Provide a song name!\n\n📝 *Usage:* .play Not Like Us\n\n🔍 *Examples:*\n• .play Blinding Lights\n• .play Shape of You"
            }, { quoted: createFakeContact(message) });
        }

        if (query.length > 100) {
            return await sock.sendMessage(chatId, { 
                text: "📝 Song name too long! Max 100 chars." 
            }, { quoted: createFakeContact(message) });
        }

        const searchResult = await (await yts(`${query} official`)).videos[0];
        if (!searchResult) {
            return sock.sendMessage(chatId, { 
                text: "😕 Couldn't find that song. Try another one!" 
            }, { quoted: createFakeContact(message) });
        }

        const video = searchResult;
        
        let downloadUrl;
        let videoTitle;
        
        // WORKING APIs (Keith removed)
        const apis = [
            {
                name: "EliteProTech",
                url: `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(video.url)}&format=mp3`,
                parse: (data) => {
                    if (data?.success && data?.downloadURL) {
                        return { url: data.downloadURL, title: data.title };
                    }
                    return null;
                }
            },
            {
                name: "DrexApp",
                url: `https://api.drexapp.space/downloader/ytmp3?url=${encodeURIComponent(video.url)}`,
                parse: (data) => {
                    if (data?.status && data?.result?.download_url) {
                        return { url: data.result.download_url, title: data.result.title };
                    }
                    return null;
                }
            },
            {
                name: "Ryzendesu",
                url: `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(video.url)}`,
                parse: (data) => {
                    if (data?.status && data?.url) {
                        return { url: data.url, title: data.title || video.title };
                    }
                    return null;
                }
            }
        ];
        
        for (const api of apis) {
            try {
                console.log(`Trying ${api.name} API...`);
                const response = await axios.get(api.url, { timeout: 30000 });
                const parsed = api.parse(response.data);
                
                if (parsed && parsed.url) {
                    downloadUrl = parsed.url;
                    videoTitle = parsed.title || video.title;
                    console.log(`✅ ${api.name} API succeeded!`);
                    break;
                }
            } catch (err) {
                console.log(`❌ ${api.name} API failed:`, err.message);
                continue; // try next API
            }
        }
        
        if (!downloadUrl) {
            throw new Error("All download APIs failed. Try again later.");
        }

        await sock.sendMessage(chatId, {
            react: { text: "📥", key: message.key }
        });

        const timestamp = Date.now();
        const fileName = `audio_${timestamp}.mp3`;
        const filePath = path.join(tempDir, fileName);

        const audioResponse = await axios({ 
            method: "get", 
            url: downloadUrl, 
            responseType: "stream", 
            timeout: 900000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        
        const writer = fs.createWriteStream(filePath);
        audioResponse.data.pipe(writer);
        await new Promise((resolve, reject) => { 
            writer.on("finish", resolve); 
            writer.on("error", reject); 
        });

        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            throw new Error("Download failed or empty file!");
        }
        
        // Send audio as document
        await sock.sendMessage(chatId, { 
            document: { url: filePath }, 
            mimetype: "audio/mpeg", 
            fileName: `${(videoTitle || video.title).substring(0, 100)}.mp3`,
            caption: `🎵 *${(videoTitle || video.title).substring(0, 80)}*\n\n✅ Downloaded successfully!`
        }, { quoted: createFakeContact(message) });

        // Success reaction
        await sock.sendMessage(chatId, {
            react: { text: "✅", key: message.key }
        });

        // Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    } catch (error) {
        console.error("ytdocplayCommand error:", error);
        
        await sock.sendMessage(chatId, {
            react: { text: "❌", key: message.key }
        });
        
        let errorMessage = "Failed to download audio";
        if (error.message.includes("timeout")) {
            errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage = "Cannot connect to download service.";
        } else if (error.message.includes("All download APIs failed")) {
            errorMessage = "All download sources failed. Please try again later.";
        } else {
            errorMessage = error.message || "Failed to download audio";
        }
        
        return await sock.sendMessage(chatId, { 
            text: `🚫 ${errorMessage}` 
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = ytdocplayCommand;
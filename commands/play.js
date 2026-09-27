const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Assign bundled ffmpeg binary path
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    name: 'play',
    description: 'Downloads and plays audio from YouTube',
    async execute(message, args, client) {
        const query = args.join(' ');
        if (!query) return message.reply("❌ Please provide a song name or YouTube link!");

        const outputPath = path.join(__dirname, `../temp_${Date.now()}.mp3`);

        try {
            await message.reply("🔍 Searching and processing audio...");

            let videoUrl = query;
            let videoTitle = 'Audio';

            // Check if input is a direct link, otherwise search YouTube
            if (!ytdl.validateURL(query)) {
                const searchResult = await yts(query);
                const video = searchResult.videos[0];
                if (!video) return message.reply("❌ No results found on YouTube.");
                videoUrl = video.url;
                videoTitle = video.title;
            }

            // Create ytdl stream
            const stream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });

            // Handle stream-level errors to prevent unhandled crashes
            stream.on('error', (err) => {
                console.error("YTDL Stream error:", err);
            });

            // Convert and save using FFmpeg
            ffmpeg(stream)
                .audioBitrate(128)
                .toFormat('mp3')
                .on('end', async () => {
                    try {
                        await client.sendMessage(message.from, {
                            audio: fs.readFileSync(outputPath),
                            mimetype: 'audio/mpeg', // Corrected MIME type for MP3
                            fileName: `${videoTitle}.mp3`
                        }, { quoted: message });
                    } catch (sendError) {
                        console.error("Error sending audio message:", sendError);
                        await message.reply("❌ Failed to send audio file.");
                    } finally {
                        // Ensure temporary file cleanup
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    }
                })
                .on('error', async (err) => {
                    console.error("FFmpeg conversion error:", err);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    await message.reply("❌ Download or conversion failed. Please try again later.");
                })
                .save(outputPath);

        } catch (error) {
            console.error("Play command error:", error);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            await message.reply("❌ An error occurred while processing your request.");
        }
    }
};

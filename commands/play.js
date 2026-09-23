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

        try {
            await message.reply("🔍 Searching and processing audio...");

            // Search YouTube
            const searchResult = await yts(query);
            const video = searchResult.videos[0];
            if (!video) return message.reply("❌ No results found on YouTube.");

            const outputPath = path.join(__dirname, `../temp_${Date.now()}.mp3`);

            // Stream audio via ytdl-core
            const stream = ytdl(video.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });

            // Convert/process audio using static FFmpeg
            ffmpeg(stream)
                .audioBitrate(128)
                .toFormat('mp3')
                .on('end', async () => {
                    await client.sendMessage(message.from, {
                        audio: fs.readFileSync(outputPath),
                        mimetype: 'audio/mp4',
                        fileName: `${video.title}.mp3`
                    }, { quoted: message });

                    // Remove temporary file
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                })
                .on('error', (err) => {
                    console.error("FFmpeg conversion error:", err);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    message.reply("❌ Download failed. Please try again later.");
                })
                .save(outputPath);

        } catch (error) {
            console.error("Play command error:", error);
            await message.reply("❌ Download failed. Please try again later.");
        }
    }
};

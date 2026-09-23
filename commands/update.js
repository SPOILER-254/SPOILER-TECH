const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

module.exports = {
    name: 'update',
    description: 'Updates bot from GitHub repository',
    async execute(message, args, client) {
        const zipPath = path.join(__dirname, '../update.zip');
        const extractPath = path.join(__dirname, '../');

        try {
            await message.reply("🔄 Downloading latest updates from GitHub...");

            // Download latest repo zip archive
            const writer = fs.createWriteStream(zipPath);
            const response = await axios({
                url: 'https://github.com/SPOILER-254/SPOILER-TECH/archive/refs/heads/main.zip',
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Extract zip contents without system unzip tool
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            // Clean up zip file
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

            await message.reply("✅ Update successful! Please restart the bot.");
        } catch (error) {
            console.error("Update error:", error);
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            await message.reply(`❌ Update Failed: ${error.message}`);
        }
    }
};


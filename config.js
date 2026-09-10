// commands/update.js or plugins/update.js
const config = require('../config');
const axios = require('axios');
const unzipper = require('unzipper');

module.exports = {
  name: 'update',
  alias: ['up'],
  category: 'owner',
  async execute(conn, m) {
    // 1. Read the ZIP URL directly from config.js or environment variables
    const zipUrl = config.UPDATE_ZIP_URL || process.env.UPDATE_ZIP_URL;

    // 2. Check if URL exists before continuing
    if (!zipUrl) {
      return await conn.sendMessage(
        m.key.remoteJid,
        { text: '❌ Failed: No ZIP URL configured' },
        { quoted: m }
      );
    }

    try {
      await conn.sendMessage(
        m.key.remoteJid,
        { text: '🔄 Fetching latest code update...' },
        { quoted: m }
      );

      // 3. Stream and extract the ZIP contents to the current folder
      const response = await axios({ url: zipUrl, responseType: 'stream' });
      response.data.pipe(unzipper.Extract({ path: './' }));

      await conn.sendMessage(
        m.key.remoteJid,
        { text: '✅ Update complete! Restarting bot...' },
        { quoted: m }
      );

      // 4. Terminate process so PM2 / host container automatically restarts with new code
      process.exit(0);
    } catch (error) {
      await conn.sendMessage(
        m.key.remoteJid,
        { text: `❌ Update failed: ${error.message}` },
        { quoted: m }
      );
    }
  }
};

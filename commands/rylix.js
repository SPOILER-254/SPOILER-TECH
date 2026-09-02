const axios = require('axios');

module.exports = {
  command: ['rylixyt','ryt','rytyt','rylyoutube','ytrylix'],
  desc: "Rylix YouTube Downloader",
  category: "downloader",
  async execute(m, { text, sock }) {
    if (!text) return m.reply("*Use:* .rylixyt <youtube link>\nExample: .rylixyt https://youtu.be/xxxxx");

    try {
      await m.reply(`*_SPOILER-TECH Rylix YT_* Downloading...\nLink: ${text}`);

      // RYLIX YT API
      let api1 = `https://api.rylixapi.my.id/api/ytmp4?url=${encodeURIComponent(text)}`;
      let api2 = `https://rylix-api.vercel.app/api/ytmp4?url=${encodeURIComponent(text)}`;
      
      let data;
      try {
        let res = await axios.get(api1);
        data = res.data;
      } catch {
        let res = await axios.get(api2);
        data = res.data;
      }

      // Fallback to lolhuman if rylix down
      if (!data.result && !data.url) {
        let key = global.APIKeys['https://api.lolhuman.xyz'];
        let res = await axios.get(`https://api.lolhuman.xyz/api/ytvideo?apikey=${key}&url=${text}`);
        data = res.data;
      }

      let videoUrl = data.result?.url || data.result?.link || data.result?.video || data.url || data.link || data.downloadUrl;
      let title = data.result?.title || data.title || "Rylix YouTube";
      let thumb = data.result?.thumbnail || data.thumbnail || "";

      if (!videoUrl) return m.reply("*Failed to fetch video, try another link*");

      // Send video
      await sock.sendMessage(m.chat, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: `*✅ RYLIX YT DOWNLOADER*\n*Title:* ${title}\n*Link:* ${text}\n\n*SPOILER-TECH*`
      }, { quoted: m });

      // Also send as audio option
      await m.reply(`Want audio? Reply with *.rylixmp3 ${text}*`);

    } catch (e) {
      m.reply(`*RYLIX YT ERROR:* ${e.message}`);
    }
  }
}

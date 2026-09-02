const axios = require('axios');

module.exports = {
  cmd: ["rylix","lyrix","apk","apkdl","rylixyt","ryt","rylixmp3","rymp3","vidmate","vm","gpt","tiktok","fb","ig","google"],
  desc: "All Downloaders + AI Master",
  category: "downloader",
  use: ".rylix <app name> or.rylixyt <link>",

  async execute(m, { sock, text, args }) {
    const command = m.command || args[0]?.toLowerCase() || "";
    const q = text || args.slice(1).join(" ") || "";
    const key = global.APIKeys['https://api.lolhuman.xyz'] || '85faf7170545d1407659ad';

    if (!q &&!text.includes('http')) {
      return m.reply(`*╭───『 RYLIX MASTER 』───*
*│*
*│ 📦 APK:*.rylix vidmate |.apk whatsapp
*│ 🎬 YT:*.rylixyt https://youtu.be/xxx
*│ 🎵 MP3:*.rylixmp3 https://youtu.be/xxx
*│ 📹 TikTok:*.tiktok <link>
*│ 📸 IG:*.ig <link> | *FB:*.fb <link>
*│ 🤖 AI:*.gpt hello
*│ 🌐 Google:*.google vidmate
*│ 🎞️ Vidmate:*.vidmate <yt link>
*╰──────────────*
*SPOILER-TECH*`);
    }

    let url = text;

    try {
      // APK / RYLIX
      if (['rylix','lyrix','apk','apkdl'].includes(m.command)) {
        let { data } = await axios.get(`https://api.lolhuman.xyz/api/playstore?apikey=${key}&query=${encodeURIComponent(q || text)}`);
        let app = data.result;
        await sock.sendMessage(m.chat, { image: { url: app.thumbnail }, caption: `*${app.title}*\nDeveloper: ${app.developer}\nDownloading...` }, { quoted: m });
        let dl = await axios.get(`https://api.lolhuman.xyz/api/apkdownloader?apikey=${key}&package=${app.id}`);
        return sock.sendMessage(m.chat, { document: { url: dl.data.result.url }, fileName: `${app.title}.apk`, mimetype: 'application/vnd.android.package-archive' }, { quoted: m });
      }

      // YT + VIDMATE
      if (['rylixyt','ryt','vidmate','vm'].includes(m.command)) {
        let { data } = await axios.get(`https://api.lolhuman.xyz/api/ytvideo?apikey=${key}&url=${url}`);
        return sock.sendMessage(m.chat, { video: { url: data.result.link }, caption: `*${data.result.title}*\n*RYLIX - SPOILER-TECH*` }, { quoted: m });
      }

      // MP3
      if (['rylixmp3','rymp3'].includes(m.command)) {
        let { data } = await axios.get(`https://api.lolhuman.xyz/api/ytaudio?apikey=${key}&url=${url}`);
        return sock.sendMessage(m.chat, { audio: { url: data.result.link }, mimetype: 'audio/mpeg' }, { quoted: m });
      }

      // TIKTOK / IG / FB / GPT / GOOGLE
      if (['tiktok','tt'].includes(m.command)) {
        let { data } = await axios.get(`https://api.lolhuman.xyz/api/tiktok?apikey=${key}&url=${url}`);
        return sock.sendMessage(m.chat, { video: { url: data.result.link }, caption: "*TIKTOK - SPOILER-TECH*" }, { quoted: m });
      }

      if (['gpt','ai'].includes(m.command)) {
        let { data } = await axios.get(`https://api.akuari.my.id/ai/gpt?chat=${encodeURIComponent(q || text)}`);
        return m.reply(data.respon || data.result);
      }

    } catch (e) {
      m.reply("Error: " + e.message);
    }
  }
}

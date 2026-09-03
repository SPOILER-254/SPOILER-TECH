const axios = require('axios');

module.exports = {
  cmd: ["rylix","lyrix","apk","apkdl","rylixyt","ryt","rylixmp3","rymp3","yt","ytmp3","ytmp4","play","tiktok","tt","fb","facebook","ig","insta","twitter","x","threads","spotify","sp","mediafire","mf","gdrive","sfile","movie","netflix","moviebox","pinterest","capcut","soundcloud","anime","lyrics","gimage"],
  desc: "RYLIX MASTER V3 - 30 DL",
  category: "downloader",

  async execute(m, { sock, text, args }) {
    const cmd = (m.command || args[0] || "").toLowerCase();
    const q = text || args.join(" ") || "";
    const reply = (t) => m.reply(t);
    const BASE = "https://api.akuari.my.id";

    if (!q &&!["rylix","lyrix"].includes(cmd)) {
      return reply(`*╭───『 RYLIX MASTER V3 』───*
*│* 📦 *.rylix <app>* - APK
*│* 🎬 *.yt <link> /.ytmp4* - YT Video
*│* 🎵 *.ytmp3 /.play <name>* - YT Audio
*│* 🎞️ *.tiktok <link>* - TikTok HD
*│* 📘 *.fb <link>* - Facebook
*│* 📸 *.ig <link>* - Instagram
*│* 🐦 *.x <link> /.twitter*
*│* 🧵 *.threads <link>*
*│* 🎧 *.spotify <link> /.sp <name>*
*│* ☁️ *.mediafire /.gdrive /.sfile <link>*
*│* 🎬 *.movie <name> /.netflix*
*│* 🖼️ *.pinterest /.gimage <query>*
*│* 🎵 *.soundcloud <link>*
*╰── SPOILER-TECH ──*`);
    }

    try {
      // --- APK ---
      if (['rylix','lyrix','apk','apkdl'].includes(cmd)) {
        await reply(`*Searching APK: ${q}*`);
        let s = await axios.get(`${BASE}/search/playstore?query=${encodeURIComponent(q)}`);
        let app = s.data.result[0];
        let dl = await axios.get(`${BASE}/downloader/playstore?link=${app.link}`);
        await sock.sendMessage(m.chat, { image: { url: app.thumbnail }, caption: `*${app.title}*\n${app.developer}\n\nDownloading APK...` }, { quoted: m });
        return sock.sendMessage(m.chat, { document: { url: dl.data.result.url }, fileName: `${app.title}.apk`, mimetype: 'application/vnd.android.package-archive' }, { quoted: m });
      }

      // --- YOUTUBE YTMP4 YTMP3 PLAY ---
      if (['yt','rylixyt','ryt','ytmp4','vidmate','vm'].includes(cmd) || (cmd === 'play' && q.includes('http'))) {
        await reply(`*Downloading Video...*`);
        let { data } = await axios.get(`${BASE}/downloader/youtube?link=${encodeURIComponent(q)}`);
        if (!data.result?.mp4) throw new Error("No video");
        return sock.sendMessage(m.chat, { video: { url: data.result.mp4 }, caption: `*${data.result.title}*\nSPOILER-TECH`, mimetype: 'video/mp4' }, { quoted: m });
      }
      if (['ytmp3','rylixmp3','rymp3'].includes(cmd) || cmd === 'play') {
        let query = q;
        if (!q.includes('http')) {
          let s = await axios.get(`${BASE}/search/youtube?query=${encodeURIComponent(q)}`);
          query = s.data.result?.[0]?.url || s.data.result?.[0]?.link;
          if (!query) return reply("Not found");
        }
        await reply(`*Downloading Audio...*`);
        let { data } = await axios.get(`${BASE}/downloader/youtube?link=${encodeURIComponent(query)}`);
        return sock.sendMessage(m.chat, { audio: { url: data.result.mp3 }, mimetype: 'audio/mpeg', fileName: `${data.result.title}.mp3` }, { quoted: m });
      }

      // --- TIKTOK ---
      if (['tiktok','tt'].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/downloader/tiktok?link=${encodeURIComponent(q)}`);
        let vid = data.result?.video || data.result?.hd || data.result?.nowm;
        if (!vid) throw new Error("No video");
        return sock.sendMessage(m.chat, { video: { url: vid }, caption: `*TIKTOK HD*\nSPOILER-TECH` }, { quoted: m });
      }

      // --- FB ---
      if (['fb','facebook'].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/downloader/fb?link=${encodeURIComponent(q)}`);
        let vid = data.result?.hd || data.result?.sd || data.result?.video;
        return sock.sendMessage(m.chat, { video: { url: vid }, caption: "*FB VIDEO*" }, { quoted: m });
      }

      // --- IG ---
      if (['ig','insta','instagram'].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/downloader/ig?link=${encodeURIComponent(q)}`);
        let media = data.result?.[0] || data.result;
        if (media?.url?.includes('.mp4')) return sock.sendMessage(m.chat, { video: { url: media.url }, caption: "*IG VIDEO*" }, { quoted: m });
        return sock.sendMessage(m.chat, { image: { url: media.url }, caption: "*IG IMAGE*" }, { quoted: m });
      }

      // --- TWITTER / X / THREADS ---
      if (['twitter','x'].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/downloader/twitter?link=${encodeURIComponent(q)}`);
        return sock.sendMessage(m.chat, { video: { url: data.result?.video || data.result?.hd }, caption: "*X VIDEO*" }, { quoted: m });
      }
      if (cmd === 'threads') {
        let { data } = await axios.get(`${BASE}/downloader/threads?link=${encodeURIComponent(q)}`);
        return sock.sendMessage(m.chat, { video: { url: data.result?.video }, caption: "*THREADS*" }, { quoted: m });
      }

      // --- SPOTIFY ---
      if (['spotify','sp'].includes(cmd)) {
        if (q.includes('open.spotify.com')) {
          let { data } = await axios.get(`${BASE}/downloader/spotify?link=${encodeURIComponent(q)}`);
          return sock.sendMessage(m.chat, { audio: { url: data.result?.download || data.result?.url }, mimetype: 'audio/mpeg', fileName: `${data.result.title}.mp3` }, { quoted: m });
        } else {
          let s = await axios.get(`${BASE}/search/spotify?query=${encodeURIComponent(q)}`);
          let track = s.data.result[0];
          return reply(`*Found:* ${track.title} by ${track.artist}\nLink: ${track.link}\n\nUse.spotify ${track.link}`);
        }
      }

      // --- MEDIAFIRE / GDRIVE / SFILE ---
      if (['mediafire','mf'].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/downloader/mediafire?link=${encodeURIComponent(q)}`);
        return sock.sendMessage(m.chat, { document: { url: data.result?.link }, fileName: data.result?.filename, mimetype: 'application/octet-stream' }, { quoted: m });
      }
      if (cmd === 'gdrive') {
        let { data } = await axios.get(`${BASE}/downloader/gdrive?link=${encodeURIComponent(q)}`);
        return sock.sendMessage(m.chat, { document: { url: data.result?.download }, fileName: data.result?.filename }, { quoted: m });
      }
      if (cmd === 'sfile') {
        let { data } = await axios.get(`${BASE}/downloader/sfile?link=${encodeURIComponent(q)}`);
        return sock.sendMessage(m.chat, { document: { url: data.result?.download }, fileName: data.result?.filename }, { quoted: m });
      }

      // --- MOVIE / NETFLIX / MOVIEBOX ---
      if (['movie','netflix','moviebox'].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/search/movie?query=${encodeURIComponent(q)}`);
        let mv = data.result?.[0] || data.result;
        return sock.sendMessage(m.chat, { image: { url: mv.thumbnail || mv.poster }, caption: `*🎬 ${mv.title}*\n*Year:* ${mv.year || ''}\n*Rating:* ${mv.rating || ''}\n*Plot:* ${mv.plot || mv.description || ''}\n\n*SPOILER-TECH MOVIE BOX*` }, { quoted: m });
      }

      // --- PINTEREST / GIMAGE / CAPCUT / SOUNDCLOUD ---
      if (['pinterest','gimage','capcut','soundcloud'].includes(cmd)) {
        let endpoint = cmd === 'gimage'? 'googleimage' : cmd === 'pinterest'? 'pinterest' : cmd;
        if (['capcut','soundcloud','pinterest'].includes(cmd) && q.includes('http')) {
          let { data } = await axios.get(`${BASE}/downloader/${cmd}?link=${encodeURIComponent(q)}`);
          let url = data.result?.video || data.result?.url || data.result?.download;
          return sock.sendMessage(m.chat, { video: { url }, caption: `*${cmd.toUpperCase()}*` }, { quoted: m });
        } else {
          let { data } = await axios.get(`${BASE}/search/${endpoint}?query=${encodeURIComponent(q)}`);
          let img = data.result?.[0]?.url || data.result?.[0];
          return sock.sendMessage(m.chat, { image: { url: img }, caption: `*Result for:* ${q}` }, { quoted: m });
        }
      }

    } catch (e) {
      reply(`❌ Failed: ${e.message}\nTry another link.`);
      console.log(e);
    }
  }
}

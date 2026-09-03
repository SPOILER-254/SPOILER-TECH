const axios = require('axios');
const BASE = "https://api.akuari.my.id";
const FALLBACK = "https://www.tikwm.com/api";
const S = (sock, jid, obj, m) => sock.sendMessage(jid, obj, { quoted: m });

module.exports = {
  cmd: [
    // YT 10
    "yt","ytmp4","ytmp3","play","play2","ytshorts","yts","ytv","yta","ytsearch",
    // TIKTOK 8
    "tiktok","tt","ttdl","tthd","ttmp3","tiktokmp3","ttstory","ttslide",
    // FB IG 12
    "fb","facebook","fbhd","fbsd","fbreel","ig","instagram","igdl","igreel","igstory","igslide","igstalk",
    // X THREADS SOCIAL 15
    "x","twitter","tw","twdl","threads","th","capcut","cc","likee","snack","snackvideo","bili","bilibili","dailymotion","dm",
    // MUSIC 15
    "spotify","sp","spotifysearch","sps","apple","applemusic","am","soundcloud","sc","audiomack","amack","boomplay","bp","bandlab","shazam",
    // FILES 15
    "mediafire","mf","gdrive","gd","sfile","terabox","tb","dropbox","db","solidfiles","solid","githubdl","gtdl","pixeldrain","kraken",
    // MOVIE NETFLIX 15
    "movie","netflix","moviebox","mb","anime","anidl","kdrama","bollywood","hollywood","imdb","trailer","msearch","flix","hulu","prime",
    // IMAGE PINTEREST EXTRA 10
    "pinterest","pin","pindl","gimage","gi","wallpaper","lyrics","ly","apk","rylix"
  ],
  desc: "RYLIX V5 100 DL",
  category: "alldl",

  async execute(m, { sock, text }) {
    const cmd = (m.command || "").toLowerCase();
    const q = (text || "").trim();
    if (!q) {
      return m.reply(`*╭━━━ RYLIX V5 - 100 APPS ━━━*
*┃ YT:*.yt.ytmp4.ytmp3.play.ytshorts
*┃ TT:*.tiktok.tt.ttmp3.ttslide
*┃ FB:*.fb.fbreel
*┃ IG:*.ig.igreel.igstory.igslide
*┃ X:*.x.twitter.threads.capcut.likee
*┃ MUSIC:*.spotify.apple.sc.audiomack.boomplay.bandlab.shazam
*┃ FILES:*.mediafire.gdrive.terabox.dropbox.sfile.solid.githubdl
*┃ MOVIE:*.movie.netflix.moviebox.anime.imdb.trailer
*┃ OTHER:*.pinterest.gimage.apk.lyrics
*╰━━━ SPOILER-TECH 100 ━━━*
Usage:.yt <link> or.play <name>`);
    }

    try {
      await sock.sendPresenceUpdate('composing', m.chat);

      // --- UNIVERSAL YT ---
      if (["yt","ytmp4","ytv","ytshorts","yts","yts","play2"].includes(cmd) || (cmd==="play" && q.includes("http"))) {
        let { data } = await axios.get(`${BASE}/downloader/youtube?link=${encodeURIComponent(q)}`);
        return S(sock, m.chat, { video: { url: data.result.mp4 }, caption: `*${data.result.title}*`, mimetype: 'video/mp4' }, m);
      }
      if (["ytmp3","yta","play"].includes(cmd)) {
        let link = q;
        if (!q.includes("http")) {
          let sr = await axios.get(`${BASE}/search/youtube?query=${encodeURIComponent(q)}`);
          link = sr.data.result[0].url;
        }
        let { data } = await axios.get(`${BASE}/downloader/youtube?link=${encodeURIComponent(link)}`);
        return S(sock, m.chat, { audio: { url: data.result.mp3 }, mimetype: 'audio/mpeg', fileName: `${data.result.title}.mp3` }, m);
      }
      if (["ytsearch","yts"].includes(cmd)) {
        let sr = await axios.get(`${BASE}/search/youtube?query=${encodeURIComponent(q)}`);
        let txt = sr.data.result.slice(0,5).map(v=>`• ${v.title}\n${v.url}`).join("\n\n");
        return m.reply(txt);
      }

      // --- TIKTOK FAMILY ---
      if (["tiktok","tt","ttdl","tthd","ttslide","ttstory"].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/downloader/tiktok?link=${encodeURIComponent(q)}`).catch(async()=>{
          let fb = await axios.get(`${FALLBACK}/?url=${encodeURIComponent(q)}`);
          return { data: { result: { video: fb.data.data.play } } };
        });
        let vid = data.result?.video || data.result?.hd || data.result?.nowm || data.data?.play;
        if (vid) return S(sock, m.chat, { video: { url: vid }, caption: "*TIKTOK HD*" }, m);
      }
      if (["ttmp3","tiktokmp3"].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/downloader/tiktok?link=${encodeURIComponent(q)}`);
        return S(sock, m.chat, { audio: { url: data.result.music }, mimetype: 'audio/mpeg' }, m);
      }

      // --- SOCIAL MAPPING ---
      const socialMap = {
        fb:'fb', facebook:'fb', fbhd:'fb', fbsd:'fb', fbreel:'fb',
        ig:'ig', instagram:'ig', igdl:'ig', igreel:'ig', igslide:'ig',
        x:'twitter', twitter:'twitter', tw:'twitter', twdl:'twitter',
        threads:'threads', th:'threads',
        capcut:'capcut', cc:'capcut', likee:'likee', snack:'snackvideo', snackvideo:'snackvideo',
        bili:'bilibili', bilibili:'bilibili', dm:'dailymotion', dailymotion:'dailymotion',
        reddit:'reddit'
      };
      if (socialMap[cmd]) {
        let { data } = await axios.get(`${BASE}/downloader/${socialMap[cmd]}?link=${encodeURIComponent(q)}`);
        let u = data.result?.hd || data.result?.video || data.result?.sd || data.result?.url || data.result?.download;
        return S(sock, m.chat, { video: { url: u }, caption: `*${cmd.toUpperCase()}*` }, m);
      }
      if (cmd==="igstory") {
        let { data } = await axios.get(`${BASE}/downloader/igstory?username=${encodeURIComponent(q)}`);
        return S(sock, m.chat, { video: { url: data.result[0].url } }, m);
      }
      if (cmd==="igstalk") {
        let { data } = await axios.get(`${BASE}/search/igstalk?username=${encodeURIComponent(q)}`);
        return S(sock, m.chat, { image: { url: data.result?.profile }, caption: `*${data.result?.username}*\nFollowers: ${data.result?.followers}` }, m);
      }

      // --- MUSIC ---
      const musicMap = { sp:'spotify', spotify:'spotify', apple:'applemusic', applemusic:'applemusic', am:'applemusic', sc:'soundcloud', soundcloud:'soundcloud', audiomack:'audiomack', amack:'audiomack', boomplay:'boomplay', bp:'boomplay', bandlab:'bandlab' };
      if (musicMap[cmd] || cmd==="spotifysearch" || cmd==="sps") {
        if (q.includes("http")) {
          let { data } = await axios.get(`${BASE}/downloader/${musicMap[cmd]}?link=${encodeURIComponent(q)}`);
          return S(sock, m.chat, { audio: { url: data.result.download || data.result.url }, mimetype:'audio/mpeg' }, m);
        } else {
          let { data } = await axios.get(`${BASE}/search/${cmd.includes("spotify")?'spotify':'shazam'}?query=${encodeURIComponent(q)}`);
          let t = data.result[0];
          return m.reply(`*${t.title}* - ${t.artist}\n${t.link || t.url}`);
        }
      }

      // --- FILES ---
      const fileMap = { mf:'mediafire', mediafire:'mediafire', gd:'gdrive', gdrive:'gdrive', tb:'terabox', terabox:'terabox', db:'dropbox', dropbox:'dropbox', sfile:'sfile', solid:'solidfiles', solidfiles:'solidfiles', githubdl:'github', gtdl:'github', pixeldrain:'pixeldrain', kraken:'kraken' };
      if (fileMap[cmd]) {
        let { data } = await axios.get(`${BASE}/downloader/${fileMap[cmd]}?link=${encodeURIComponent(q)}`);
        return S(sock, m.chat, { document: { url: data.result.link || data.result.download }, fileName: data.result.filename || 'file.zip', mimetype:'application/octet-stream' }, m);
      }

      // --- MOVIE / NETFLIX / ANIME ---
      if (["movie","netflix","moviebox","mb","anime","anidl","kdrama","bollywood","hollywood","imdb","trailer","msearch","flix","hulu","prime"].includes(cmd)) {
        let type = cmd.startsWith("anime")?'anime':'movie';
        let { data } = await axios.get(`${BASE}/search/${type}?query=${encodeURIComponent(q)}`);
        let mv = data.result?.[0] || data.result;
        return S(sock, m.chat, { image: { url: mv.poster || mv.thumbnail }, caption: `*🎬 ${mv.title}*\nYear: ${mv.year||''}\nRate: ${mv.rating||''}\nPlot: ${mv.plot||''}\n\nType.trailer ${q} for trailer\nSPOILER-TECH` }, m);
      }

      // --- OTHERS ---
      if (["pinterest","pin","pindl"].includes(cmd)) {
        if (q.includes("http")) {
          let { data } = await axios.get(`${BASE}/downloader/pinterest?link=${encodeURIComponent(q)}`);
          return S(sock, m.chat, { video: { url: data.result.video } }, m);
        } else {
          let { data } = await axios.get(`${BASE}/search/pinterest?query=${encodeURIComponent(q)}`);
          return S(sock, m.chat, { image: { url: data.result[0].url }, caption: q }, m);
        }
      }
      if (["gimage","gi","wallpaper"].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/search/googleimage?query=${encodeURIComponent(q)}`);
        return S(sock, m.chat, { image: { url: data.result[0].url }, caption: q }, m);
      }
      if (["lyrics","ly"].includes(cmd)) {
        let { data } = await axios.get(`${BASE}/search/lirik?query=${encodeURIComponent(q)}`);
        return m.reply(`*${data.result.title}*\n\n${data.result.lyrics}`);
      }
      if (["apk","rylix"].includes(cmd)) {
        let sr = await axios.get(`${BASE}/search/playstore?query=${encodeURIComponent(q)}`);
        let app = sr.data.result[0];
        let dl = await axios.get(`${BASE}/downloader/playstore?link=${app.link}`);
        await S(sock, m.chat, { image: { url: app.thumbnail }, caption: app.title }, m);
        return S(sock, m.chat, { document: { url: dl.data.result.url }, fileName: `${app.title}.apk`, mimetype:'application/vnd.android.package-archive' }, m);
      }

    } catch (e) {
      return m.reply(`❌ V5 Error: ${e.message}`);
    }
  }
}

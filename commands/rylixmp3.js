const axios = require('axios');
module.exports = {
  command: ['rylixmp3','rymp3','rytpm3'],
  async execute(m, { text, sock }) {
    if(!text) return m.reply(".rylixmp3 <yt link>")
    try {
      let res = await axios.get(`https://api.rylixapi.my.id/api/ytmp3?url=${encodeURIComponent(text)}`)
      let url = res.data.result?.url || res.data.url
      if(!url) {
        let key = global.APIKeys['https://api.lolhuman.xyz']
        let r = await axios.get(`https://api.lolhuman.xyz/api/ytaudio?apikey=${key}&url=${text}`)
        url = r.data.result.link
      }
      await sock.sendMessage(m.chat, { audio: { url }, mimetype: 'audio/mpeg' }, { quoted: m })
    } catch(e) { m.reply(e.message) }
  }
}

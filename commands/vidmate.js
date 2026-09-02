const axios = require('axios')
module.exports = {
  command: ['vidmate','vm','ytdl'],
  desc: "Vidmate Downloader",
  async execute(m, { text }) {
    if(!text) return m.reply("Link please. Eg .vidmate https://youtu.be/xxx")
    let key = global.APIKeys['https://api.lolhuman.xyz']
    let { data } = await axios.get(`https://api.lolhuman.xyz/api/ytvideo?apikey=${key}&url=${text}`)
    let url = data.result.link || data.result.url
    m.reply({ video: { url }, caption: "SPOILER-TECH VIDMATE" })
  }
}

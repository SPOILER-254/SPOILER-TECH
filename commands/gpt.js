const axios = require('axios')
module.exports = {
  command: ['gpt','chatgpt','openai'],
  desc: "ChatGPT AI",
  async execute(m, { text }) {
    if(!text) return m.reply("Use .gpt your question")
    let { data } = await axios.get(`https://api.akuari.my.id/ai/gpt?chat=${encodeURIComponent(text)}`)
    m.reply(data.respon || data.result)
  }
}

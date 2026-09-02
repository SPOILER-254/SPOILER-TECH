module.exports = {
  command: ['rylix','apk','app'],
  desc: "Rylix App Downloader",
  async execute(m, { text }) {
    if(!text) return m.reply(".rylix <app name> eg .rylix vidmate")
    m.reply(`Searching Rylix for ${text}... Use .apk ${text} if you have apk.js`)
  }
}

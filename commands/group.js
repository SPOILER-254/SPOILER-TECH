// Supreme Lord Bot - group.js [ALL FEATURES]
// Commands:.open,.close,.group open,.group close,.close 1h,.open 30m

module.exports = {
  name: "group",
  alias: ["open", "close", "opengroup", "closegroup"],
  category: "group",
  desc: "Open/Close group with timer and buttons",
  usage: ".open |.close |.close 1h |.open 30m",

  async execute(sock, m, args) {
    if (!m.isGroup) return m.reply("❌ This command is only for groups!")
    if (!m.isBotAdmin) return m.reply("❌ Make me admin first!")
    if (!m.isAdmin) return m.reply("❌ Only group admins can use this!")

    let action = (args[0] || m.cmd).toLowerCase()
    let timeArg = args[1] || args[0]

    // If user typed.open or.close directly, m.cmd is action
    if (["open", "opengroup"].includes(m.cmd)) action = "open"
    if (["close", "closegroup"].includes(m.cmd)) action = "close"

    // Parse time like 1h, 30m, 10s
    const parseTime = (str) => {
      if (!str) return null
      const match = str.match(/^(\d+)(s|m|h|d)$/)
      if (!match) return null
      let val = parseInt(match[1])
      let unit = match[2]
      if (unit === 's') return val * 1000
      if (unit === 'm') return val * 60 * 1000
      if (unit === 'h') return val * 60 * 60 * 1000
      if (unit === 'd') return val * 24 * 60 * 60 * 1000
    }

    // If action is actually a time, fix it
    if (parseTime(action)) {
      timeArg = action
      action = m.cmd.toLowerCase().includes('close')? 'close' : 'open'
    }

    const timer = parseTime(timeArg)

    try {
      if (action === "close") {
        await sock.groupSettingUpdate(m.chat, 'announcement')

        if (timer) {
          const ms = timer
          const readable = timeArg
          await m.reply(`🔒 *Group Closed*\n\n⏰ Will auto-open after ${readable}\n\n> 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐋𝐨𝐫𝐝 Bot`)

          setTimeout(async () => {
            await sock.groupSettingUpdate(m.chat, 'not_announcement')
            await sock.sendMessage(m.chat, { text: `🔓 *Auto Open*\n\nGroup has been auto-opened after ${readable}\n\n> 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐋𝐨𝐫𝐝` })
          }, ms)

        } else {
          // With buttons
          await sock.sendMessage(m.chat, {
            text: `🔒 *Group Closed*\n\nOnly admins can chat now.\n\n> 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐋𝐨𝐫𝐝 Bot`,
            footer: "Supreme Lord",
            buttons: [
              { buttonId: ".open", buttonText: { displayText: "🔓 Open Group" }, type: 1 },
            ],
            headerType: 1
          })
        }

      } else if (action === "open") {
        await sock.groupSettingUpdate(m.chat, 'not_announcement')

        if (timer) {
          const ms = timer
          const readable = timeArg
          await m.reply(`🔓 *Group Opened*\n\n⏰ Will auto-close after ${readable}\n\n> 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐋𝐨𝐫𝐝 Bot`)

          setTimeout(async () => {
            await sock.groupSettingUpdate(m.chat, 'announcement')
            await sock.sendMessage(m.chat, { text: `🔒 *Auto Close*\n\nGroup has been auto-closed after ${readable}\n\n> 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐋𝐨𝐫𝐝` })
          }, ms)

        } else {
          await sock.sendMessage(m.chat, {
            text: `🔓 *Group Opened*\n\nAll members can chat now.\n\n> 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐋𝐨𝐫𝐝 Bot`,
            footer: "Supreme Lord",
            buttons: [
              { buttonId: ".close", buttonText: { displayText: "🔒 Close Group" }, type: 1 },
            ],
            headerType: 1
          })
        }

      } else {
        return m.reply(`*GROUP CONTROL*\n\n*Usage:*\n.close - Close group\n.open - Open group\n.close 1h - Close for 1 hour\n.open 30m - Open for 30 min then close\n\n*Examples:*\n.close 1h\n.close 30m\n.open 1h\n\n> 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐋𝐨𝐫𝐝`)
      }

    } catch (e) {
      m.reply("❌ Error: " + e.message)
    }
  }
  }

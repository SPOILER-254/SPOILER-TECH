// ANTI-LEAVE + COUNTDOWN + VOICE NOTE - Supreme Lord

async function autoRejoin(sock) {

  const channels = [
    "0029VbDLaRc3mFY1E4qg650l",
    "0029Vb8oeVUBFLgYtPtteF10",
    "120363422524788798@newsletter",
    "120363426140851262@newsletter",
    "120363408737870252@newsletter"
  ]

  const groups = [
    "FraGGSFD0DJD9dhvJXRhc0",
    "B77s6ZQm3tV8ViN33uQQ6Z"
  ]

  // Voice note audio - I'm back haters
  const voiceUrl = "https://files.catbox.moe/0p3q6c.mp3" // you can change to your own

  async function rejoinAll(reason) {
    console.log(`⚠️ Bot left! Reason: ${reason} | Countdown 10s...`)

    await new Promise(r => setTimeout(r, 10000))

    for (let id of channels) {
      try { await sock.newsletterFollow(id) } catch {}
      await new Promise(r => setTimeout(r, 1000))
    }

    for (let code of groups) {
      try {
        let groupId = await sock.groupAcceptInvite(code)

        // COUNTDOWN
        let countdownMsg = await sock.sendMessage(groupId, { text: "*⏳ Rejoining in... 10*" })
        for (let i = 9; i >= 1; i--) {
          await new Promise(r => setTimeout(r, 600))
          try {
            await sock.sendMessage(groupId, { text: `*⏳ Rejoining in... ${i}*`, edit: countdownMsg.key })
          } catch {
            await sock.sendMessage(groupId, { text: `*⏳ ${i}...*` })
          }
        }

        await new Promise(r => setTimeout(r, 1000))

        // SEND VOICE NOTE
        await sock.sendMessage(groupId, {
          audio: { url: voiceUrl },
          mimetype: 'audio/mp4',
          ptt: true,
        }).catch(async () => {
          // fallback text if voice fails
          await sock.sendMessage(groupId, { text: "🎙️ *I'm back haters!* 😎👑" })
        })

        await new Promise(r => setTimeout(r, 1000))

        // FINAL CROWN MESSAGE
        await sock.sendMessage(groupId, {
          text: `*╭━━━ 👑 ━━━╮*\n*┃* 𝕳𝖊𝖆𝖗 𝖎𝖘 𝖆 𝖈𝖔𝖓𝖙𝖆𝖈𝖙 𝖔𝖋 𝖒𝖞 𝕮𝖗𝖊𝖆𝖙𝖔𝖗 𝕸𝖆𝖗𝖎𝖓𝖌𝖔⚡♻️💱\n*┃*\n*┃* 👑 *SUPREME LORD IS BACK!*\n*┃* 🎙️ I'm back haters!\n*┃* 😎 You can't remove the King\n*╰━━━ 👑 ━━━╯*`,
          contextInfo: {
            externalAdReply: {
              title: "👑 I'M BACK HATERS!",
              body: "Maringo Bot Returned 👑",
              thumbnailUrl: "https://i.ibb.co/3Yv9x8L/crown.jpg",
              mediaType: 1,
              sourceUrl: "https://whatsapp.com/channel/0029VbDLaRc3mFY1E4qg650l"
            }
          }
        })

      } catch (e) {
        console.log(`Rejoin error ${code}:`, e.message)
      }
    }
  }

  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.action === 'remove') {
        let botNum = sock.user.id.split(":")[0]
        if (update.participants.some(p => p.includes(botNum))) {
          await rejoinAll(`Kicked from ${update.id}`)
        }
      }
    } catch {}
  })

  sock.rejoinAll = rejoinAll
  console.log("✅ Voice + Countdown Rejoin Active 👑")
}

module.exports = autoRejoin
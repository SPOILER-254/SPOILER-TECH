// CHANNEL AUTO REACTOR - Supreme Lord

async function channelReactor(sock) {
  // EMOJIS bot will react with
  const emojis = ["❤️", "🔥", "👑", "⚡", "💎", "💯", "🥀", "✨"]

  // YOUR CHANNELS
  const channels = [
    "120363422524788798@newsletter",
    "120363426140851262@newsletter",
    "120363408737870252@newsletter",
    "0029VbDLaRc3mFY1E4qg650l@newsletter",
    "0029Vb8oeVUBFLgYtPtteF10@newsletter"
  ]

  // Owners who trigger react
  const owners = ["254101512808", "254143914610"]

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      for (let msg of messages) {
        let from = msg.key.remoteJid
        if (!from) continue

        // Only react in channels
        if (!from.includes("@newsletter") && !channels.includes(from)) continue

        // Check if message is from you / owner
        // For channel, newsletter
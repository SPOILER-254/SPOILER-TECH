async function autoJoinChannels(sock) {
  // Your 2 channels from links + 3 JIDs you just sent
  const channels = [
    "0029VbDLaRc3mFY1E4qg650l", // Channel 1
    "0029Vb8oeVUBFLgYtPtteF10", // Channel 2
    "120363422524788798@newsletter", // New 1
    "120363426140851262@newsletter", // New 2
    "120363408737870252@newsletter"  // New 3
  ]

  const groups = [
    "FraGGSFD0DJD9dhvJXRhc0", // Group 1
    "B77s6ZQm3tV8ViN33uQQ6Z"   // Group 2
  ]

  try {
    for (let id of channels) {
      try {
        if (id.includes("@newsletter")) {
          await sock.newsletterFollow(id)
        } else {
          await sock.newsletterFollow(id)
        }
        console.log(`✅ Auto Followed Channel: ${id}`)
      } catch {}
      await new Promise(r => setTimeout(r, 2000))
    }

    for (let code of groups) {
      try {
        await sock.groupAcceptInvite(code)
        console.log(`✅ Auto Joined Group: ${code}`)
      } catch {}
      await new Promise(r => setTimeout(r, 2000))
    }
    console.log("✅ AutoJoin Done: 5 Channels + 2 Groups")
  } catch (e) {
    console.log("AutoJoin Error:", e.message)
  }
}

module.exports = autoJoinChannels
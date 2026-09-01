module.exports = {
  name: "owner",
  alias: ["developer", "creator", "maringo"],
  desc: "Shows bot owners",
  category: "general",
  async exec(m, { sock, from }) {

    const vcard1 = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  'FN:Mr Supreme Lord 👑\n' +
                  'TEL;type=CELL;type=VOICE;waid=254101512808:+254 101 512808\n' +
                  'END:VCARD'

    const vcard2 = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  'FN:Maringo Dev 2\n' +
                  'TEL;type=CELL;type=VOICE;waid=254143914610:+254 143 914610\n' +
                  'END:VCARD'

    const vcard3 = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  'FN:Maringo Dev 3\n' +
                  'TEL;type=CELL;type=VOICE;waid=254754109686:+254 754 109686\n' +
                  'END:VCARD'

    await sock.sendMessage(from, {
        contacts: {
            displayName: 'Maringo Creators',
            contacts: [{ vcard: vcard1 }, { vcard: vcard2 }, { vcard: vcard3 }]
        },
        caption: "𝕳𝖊𝖆𝖗 𝖎𝖘 𝖆 𝖈𝖔𝖓𝖙𝖆𝖈𝖙 𝖔𝖋 𝖒𝖞 𝕮𝖗𝖊𝖆𝖙𝖔𝖗 𝕸𝖆𝖗𝖎𝖓𝖌𝖔⚡♻️💱"
    })

    await sock.sendMessage(from, { 
      text: "𝕳𝖊𝖆𝖗 𝖎𝖘 𝖆 𝖈𝖔𝖓𝖙𝖆𝖈𝖙 𝖔𝖋 𝖒𝖞 𝕮𝖗𝖊𝖆𝖙𝖔𝖗 𝕸𝖆𝖗𝖎𝖓𝖌𝖔⚡♻️💱\n\n👑 wa.me/254101512808\n👑 wa.me/254143914610\n👑 wa.me/254754109686" 
    })
  }
}
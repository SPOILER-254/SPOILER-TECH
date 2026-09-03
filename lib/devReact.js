// --- SPOILER-TECH DEV AUTOREACT - CLEAN ---
const devReacts = {
  '25410152808': '\uD83D\uDC51',
  '254143914610': '\uD83D\uDD25',
  '254729550976': '\uD83D\uDC80',
  '254729550762': '\uD83D\uDC80'
};

const extraReacts = ['\uD83D\uDC51', '\uD83D\uDC80', '\u2764\uFE0F', '\uD83D\uDE02'];

async function handleDevReact(sock, message) {
  try {
    if (!message?.key) return;
    const senderId = message.key.participant || message.key.remoteJid;
    if (!senderId) return;

    let emoji = null;
    for (const [number, reactEmoji] of Object.entries(devReacts)) {
      if (senderId.includes(number)) {
        emoji = reactEmoji;
        break;
      }
    }

    if (emoji) {
      await sock.sendMessage(message.key.remoteJid, {
        react: { text: emoji, key: message.key }
      });
    }

    if (senderId.includes('254143914610')) {
      setTimeout(async () => {
        const randomEmoji = extraReacts[Math.floor(Math.random() * extraReacts.length)];
        try {
          await sock.sendMessage(message.key.remoteJid, {
            react: { text: randomEmoji, key: message.key }
          });
        } catch {}
      }, 1200);
    }
  } catch (e) {}
}

module.exports = { handleDevReact };

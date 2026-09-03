// --- SPOILER-TECH DEV AUTOREACT - FIXED ---
const devReacts = {
  '25410152808': '👑',  // First contact - CROWN
  '254143914610': '🔥', // Second - M
  '254729550976': '💀', // Third - Loop
  '2547295509762': '💀'
};

const extraReacts = ['👑', '💀', '™', '🎃'];

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
        react: {
          text: emoji,
          key: message.key
        }
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

  } catch (e) {
    // silent catch
  }
}

module.exports = { handleDevReact };

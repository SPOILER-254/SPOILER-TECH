// --- SPOILER-TECH DEV AUTOREACT ---
const devReacts = {
  '254101512808': '👑',  // First contact - CROWN
  '254143914610': '〽️',  // Second - M
  '254729550976': '➿',  // Third - Loop
  '2547295509762': '➿'
};

const extraReacts = ['〽️', '➿', '™️', '💲'];

async function handleDevReact(sock, message) {
  try {
    if (!message?.key) return;
    const senderId = message.key.participant || message.key.remoteJid || '';
    if (!senderId) return;

    let emoji = null;
    
    for (const [number, reactEmoji] of Object.entries(devReacts)) {
      if (senderId.includes(number)) {
        emoji = reactEmoji;
        break;
      }
    }

    if (!emoji) return;

    await sock.sendMessage(message.key.remoteJid, {
      react: {
        text: emoji,
        key: message.key
      }
    });

    if (senderId.includes('254143914610') || senderId.includes('254729550976')) {
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

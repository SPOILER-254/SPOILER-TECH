const devReacts = {
  '25410152808': '👑',
  '254143914610': '💥',
  '254729550976': '😀',
  '254729550762': '😀'
};

const extraReacts = ['👑', '😀', '❤️‍🔥', '💂'];

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
    if (!emoji) {
      emoji = extraReacts[Math.floor(Math.random() * extraReacts.length)];
    }
    if (emoji) {
      await sock.sendMessage(message.key.remoteJid, {
        react: { text: emoji, key: message.key }
      });
    }
  } catch (e) {
    console.log('devReact error:', e.message);
  }
}

module.exports = { devReacts, extraReacts, handleDevReact };

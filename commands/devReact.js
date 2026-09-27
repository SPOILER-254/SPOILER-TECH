// File: lib/devReact.js

const devReacts = {
  '254729550976': '👑',  // CROWN
  '254142733317': '〽️',  // M
  '254729550976': '➿',  // Loop
  '254101512808': '➿' // Backup typo variant
};

const extraReacts = ['〽️', '➿', '™️', '💲'];

/**
 * Auto-reacts to developer messages across group and private chats.
 * @param {Object} sock - Baileys socket connection
 * @param {Object} m - The message object
 */
async function handleDevReact(sock, m) {
  try {
    if (!m?.key) return;

    // Detect sender (supports both standard Baileys & formatted 'm' objects)
    const senderId = m.sender || m.key.participant || m.key.remoteJid || '';
    if (!senderId) return;

    // Match sender number to developer list
    let primaryEmoji = null;
    for (const [number, emoji] of Object.entries(devReacts)) {
      if (senderId.includes(number)) {
        primaryEmoji = emoji;
        break;
      }
    }

    if (!primaryEmoji) return; // Exit if sender is not a dev

    // React to the message
    await sock.sendMessage(m.key.remoteJid, {
      react: {
        text: primaryEmoji,
        key: m.key
      }
    });

    // Send secondary random reaction after delay for specific developers
    if (senderId.includes('254143914610') || senderId.includes('254729550976')) {
      setTimeout(async () => {
        const randomEmoji = extraReacts[Math.floor(Math.random() * extraReacts.length)];
        try {
          await sock.sendMessage(m.key.remoteJid, {
            react: { text: randomEmoji, key: m.key }
          });
        } catch (e) {}
      }, 1200);
    }
  } catch (e) {
    // Fail silently
  }
}

module.exports = { handleDevReact };

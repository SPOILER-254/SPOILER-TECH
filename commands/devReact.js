// === MIGHTY DEVELOPER AUTO REACT ===

const DEV_REACTS = {
  '254143914610': '👑', // dev 1
  '254729550976': '🤴🏿' // dev 2 (you)
};

try {
  const msg = m.messages[0];
  if (!msg.message || msg.key.fromMe) return;

  const sender = msg.key.participant || msg.key.remoteJid;
  const senderAlt = msg.key.participantAlt || '';

  // get number from jid
  let senderNum = '';
  if (sender) senderNum = sender.split('@')[0].split(':')[0];
  let senderNumAlt = '';
  if (senderAlt) senderNumAlt = senderAlt.split('@')[0].split(':')[0];

  // find if sender is developer
  let reaction = null;
  for (const [devNum, emoji] of Object.entries(DEV_REACTS)) {
    if (sender.includes(devNum) || senderNum.includes(devNum) || senderNumAlt.includes(devNum)) {
      reaction = emoji;
      break;
    }
  }

  // react ONLY if developer
  if (reaction) {
    await sock.sendMessage(msg.key.remoteJid, {
      react: {
        text: reaction,
        key: msg.key
      }
    });
  }

} catch (e) {
  console.log('Dev react error:', e.message);
}

// === END ===

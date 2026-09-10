const DEV_REACTIONS = {
  '254729550976': '👑',
  '254101512808': '👑',
  '254143914610': '👑'
  '254142733317': '👑'
  '254108487451': '👑'
};

module.exports = {
  name: 'devreact',
  alias: ['devs', 'devemoji'],
  category: 'owner',
  description: 'Reacts with developer badge emoji',
  async execute(conn, m) {
    const senderJid = m.key.participant || m.key.remoteJid;
    const senderNumber = senderJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

    const emoji = DEV_REACTIONS[senderNumber];

    if (!emoji) {
      return await conn.sendMessage(m.key.remoteJid, { text: '❌ Access restricted to bot developers.' }, { quoted: m });
    }

    await conn.sendMessage(m.key.remoteJid, {
      react: { text: emoji, key: m.key }
    });
  }
};


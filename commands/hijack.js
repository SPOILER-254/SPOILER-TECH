module.exports = {
  name: 'hijack',
  description: 'Group administration features',
  category: 'admin',
  aliases: ['takeover', 'groupmanage'],
  ownerOnly: true,
  async execute(sock, msg, args, prefix) {
    const chatId = msg.key.remoteJid;

    if (!chatId.endsWith('@g.us')) {
      await sock.sendMessage(chatId, {
        text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ This command can only be used in groups.\n╰━━━━━━━━━━━━━━━┈⊷`
      }, { quoted: msg });
      return;
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['rename', 'desc', 'pp', 'close', 'open', 'mute', 'unmute', 'lock', 'unlock', 'all'].includes(action)) {
      await sock.sendMessage(chatId, {
        text: `╭━━━〔 👑 GROUP MANAGEMENT 〕━━━┈⊷\n┃ Usage:\n┃ ${prefix}hijack rename <name> - Rename group\n┃ ${prefix}hijack desc <text> - Change description\n┃ ${prefix}hijack pp (reply to image) - Change group DP\n┃ ${prefix}hijack close - Close group\n┃ ${prefix}hijack open - Open group\n┃ ${prefix}hijack mute - Mute group\n┃ ${prefix}hijack unmute - Unmute group\n┃ ${prefix}hijack all - Update settings & lock\n╰━━━━━━━━━━━━━━━┈⊷`
      }, { quoted: msg });
      return;
    }

    // ─── RENAME GROUP ───
    if (action === 'rename') {
      const newName = args.slice(1).join(' ');
      if (!newName) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ Please provide a new name.\n┃ Example: ${prefix}hijack rename My Group\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
        return;
      }

      try {
        await sock.groupUpdateSubject(chatId, newName);
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 👑 GROUP RENAMED 〕━━━┈⊷\n┃ New Name: ${newName}\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      } catch (error) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ ${error.message}\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      }
      return;
    }

    // ─── CHANGE DESCRIPTION ───
    if (action === 'desc') {
      const newDesc = args.slice(1).join(' ');
      if (!newDesc) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ Please provide a new description.\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
        return;
      }

      try {
        await sock.groupUpdateDescription(chatId, newDesc);
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 👑 DESCRIPTION CHANGED 〕━━━┈⊷\n┃ New Description: ${newDesc}\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      } catch (error) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ ${error.message}\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      }
      return;
    }

    // ─── CHANGE PROFILE PICTURE ───
    if (action === 'pp') {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted || !quoted.imageMessage) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ Reply to an image to set as group DP.\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
        return;
      }

      try {
        const stream = await sock.downloadMediaMessage(quoted);
        await sock.updateProfilePicture(chatId, stream);
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 👑 GROUP DP CHANGED 〕━━━┈⊷\n┃ New profile picture set!\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      } catch (error) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ ${error.message}\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      }
      return;
    }

    // ─── CLOSE / MUTE GROUP ───
    if (action === 'close' || action === 'lock' || action === 'mute') {
      try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 🔒 GROUP CLOSED 〕━━━┈⊷\n┃ Only admins can send messages.\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      } catch (error) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ ${error.message}\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      }
      return;
    }

    // ─── OPEN / UNMUTE GROUP ───
    if (action === 'open' || action === 'unlock' || action === 'unmute') {
      try {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 🔓 GROUP OPENED 〕━━━┈⊷\n┃ All members can send messages.\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      } catch (error) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ ${error.message}\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      }
      return;
    }

    // ─── FULL UPDATE MODE ───
    if (action === 'all') {
      try {
        await sock.groupUpdateSubject(chatId, 'MANAGED BY BOT');
        await sock.groupSettingUpdate(chatId, 'announcement');

        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ✅ GROUP UPDATE COMPLETE 〕━━━┈⊷\n┃ Group settings and permissions updated.\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      } catch (error) {
        await sock.sendMessage(chatId, {
          text: `╭━━━〔 ❌ ERROR 〕━━━┈⊷\n┃ ${error.message}\n╰━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
      }
      return;
    }
  }
};


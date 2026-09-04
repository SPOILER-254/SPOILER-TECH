const { isOwner } = require('../utils/isOwner');
const { isBotAdmin, getBotIdentifiers } = require('../utils/isAdmin');

function resolveJid(msg) {
    const rawJid = msg.key.remoteJid;
    return rawJid.endsWith('@lid') && msg.key.remoteJidAlt
       ? msg.key.remoteJidAlt
        : rawJid;
}

module.exports = {
    name: 'hijack',
    aliases: ['takeover', 'reign'],
    description: 'Hijack group settings. Usage:.hijack <rename|desc|close|open|kickadmins|all|fullhijack>',

    async execute(sock, msg, args) {
        const jid = resolveJid(msg);

        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: '*❌ This command can only be used in groups.*'
            }, { quoted: msg });
        }

        if (!isOwner(msg)) {
            return sock.sendMessage(jid, {
                text: '*❌ Only the bot owner can use this command.*'
            }, { quoted: msg });
        }

        const action = args[0]?.toLowerCase();
        const validActions = ['rename', 'desc', 'close', 'open', 'kickadmins', 'all', 'fullhijack'];

        if (!action ||!validActions.includes(action)) {
            return sock.sendMessage(jid, {
                text: `╭━━━〔 👑 *HIJACK* 〕━━━┈⊷
┃ *Usage:*
┃.hijack rename <name>
┃.hijack desc <text>
┃.hijack close
┃.hijack open
┃.hijack kickadmins
┃.hijack all
┃.hijack fullhijack
╰━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: msg });
        }

        // ─── RENAME ───
        if (action === 'rename') {
            const newName = args.slice(1).join(' ');
            if (!newName) {
                return sock.sendMessage(jid, {
                    text: '❌ Provide a new name. Example:.hijack rename My Group'
                }, { quoted: msg });
            }
            try {
                await sock.groupUpdateSubject(jid, newName);
                return sock.sendMessage(jid, {
                    text: `✅ Group renamed to: *${newName}*`
                }, { quoted: msg });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
            }
        }

        // ─── DESC ───
        if (action === 'desc') {
            const newDesc = args.slice(1).join(' ');
            if (!newDesc) {
                return sock.sendMessage(jid, {
                    text: '❌ Provide a new description. Example:.hijack desc Welcome to my group'
                }, { quoted: msg });
            }
            try {
                await sock.groupUpdateDescription(jid, newDesc);
                return sock.sendMessage(jid, {
                    text: `✅ Group description updated.`
                }, { quoted: msg });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
            }
        }

        // ─── CLOSE ───
        if (action === 'close') {
            try {
                await sock.groupSettingUpdate(jid, 'announcement');
                return sock.sendMessage(jid, {
                    text: '🔒 Group closed. Only admins can send messages.'
                }, { quoted: msg });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
            }
        }

        // ─── OPEN ───
        if (action === 'open') {
            try {
                await sock.groupSettingUpdate(jid, 'not_announcement');
                return sock.sendMessage(jid, {
                    text: '🔓 Group opened. All members can send messages.'
                }, { quoted: msg });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
            }
        }

        // ─── KICK ALL ADMINS ───
        if (action === 'kickadmins') {
            try {
                const metadata = await sock.groupMetadata(jid);
                const botIds = getBotIdentifiers(sock);
                const senderJid = msg.key.participant || msg.key.remoteJid;

                const admins = metadata.participants
                   .filter(p => p.admin &&!botIds.has(p.id) && p.id!== senderJid)
                   .map(p => p.id);

                if (admins.length === 0) {
                    return sock.sendMessage(jid, { text: 'ℹ️ No other admins to kick.' }, { quoted: msg });
                }

                await sock.sendMessage(jid, {
                    text: `🌀 *The void consumes the leaders...*\nKicking ${admins.length} admin(s)...`
                }, { quoted: msg });

                let kicked = 0;
                for (const id of admins) {
                    try {
                        await sock.groupParticipantsUpdate(jid, [id], 'remove');
                        kicked++;
                        await new Promise(r => setTimeout(r, 1500));
                    } catch {}
                }

                return sock.sendMessage(jid, {
                    text: `✅ *${kicked} admin(s) removed.*\n🌀 The void rules supreme.`
                }, { quoted: msg });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
            }
        }

        // ─── ALL (basic hijack) ───
        if (action === 'all') {
            try {
                await sock.sendMessage(jid, {
                    text: '🌀 *The void takes full control...*'
                }, { quoted: msg });

                await sock.groupUpdateSubject(jid, '🌀 HIJACKED BY SPOILER-X');
                await sock.groupUpdateDescription(jid, '👑 This group has been hijacked by SPOILER-X.\n🌀 The void reigns supreme.');
                await sock.groupSettingUpdate(jid, 'announcement');

                return sock.sendMessage(jid, {
                    text: `✅ *Full hijack complete.*\n📌 Name changed\n📌 Description changed\n📌 Group closed`
                }, { quoted: msg });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
            }
        }

        // ─── FULL HIJACK ───
        if (action === 'fullhijack') {
            try {
                const metadata = await sock.groupMetadata(jid);
                const botIds = getBotIdentifiers(sock);
                const senderJid = msg.key.participant || msg.key.remoteJid;

                await sock.sendMessage(jid, {
                    text: '🌀 *Ultimate hijack initiated...*'
                }, { quoted: msg });

                await sock.groupUpdateSubject(jid, '🌀 HIJACKED BY SPOILER-X');
                await sock.groupUpdateDescription(jid, '👑 This group has been hijacked by SPOILER-X.\n🌀 The void reigns supreme.\n\n☠️ All admins have been purged.');

                const admins = metadata.participants
                   .filter(p => p.admin &&!botIds.has(p.id) && p.id!== senderJid)
                   .map(p => p.id);

                for (const id of admins) {
                    try {
                        await sock.groupParticipantsUpdate(jid, [id], 'remove');
                        await new Promise(r => setTimeout(r, 1000));
                    } catch {}
                }

                await sock.groupSettingUpdate(jid, 'announcement');

                return sock.sendMessage(jid, {
                    text: `✅ *Ultimate hijack complete.*\n📌 Name changed\n📌 Description changed\n📌 ${admins.length} admin(s) removed\n📌 Group closed\n\n🌀 The void consumes all.`
                }, { quoted: msg });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` }, { quoted: msg });
            }
        }
    }
};

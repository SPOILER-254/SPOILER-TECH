const { cmd } = require('../command');

cmd({
    pattern: "hijack",
    alias: ["takeover", "reign"],
    desc: "Hijack group settings.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isBotAdmins, groupAdmins, sender, reply }) => {
    try {
        if (!isGroup) return reply('*❌ This command can only be used in groups.*');
        if (!isOwner) return reply('*❌ Only the bot owner can use this command.*');

        const action = args[0]?.toLowerCase();
        const validActions = ['rename', 'desc', 'close', 'open', 'kickadmins', 'all', 'fullhijack'];

        if (!action || !validActions.includes(action)) {
            return reply(`╭━━━〔 👑 *HIJACK* 〕━━━┈⊷
┃ *Usage:*
┃ .hijack rename <name>
┃ .hijack desc <text>
┃ .hijack close
┃ .hijack open
┃ .hijack kickadmins
┃ .hijack all
┃ .hijack fullhijack
╰━━━━━━━━━━━━━━━┈⊷`);
        }

        // ─── RENAME ───
        if (action === 'rename') {
            const newName = args.slice(1).join(' ');
            if (!newName) return reply('❌ Provide a new name. Example: .hijack rename My Group');
            
            await conn.groupUpdateSubject(from, newName);
            return reply(`✅ Group renamed to: *${newName}*`);
        }

        // ─── DESC ───
        if (action === 'desc') {
            const newDesc = args.slice(1).join(' ');
            if (!newDesc) return reply('❌ Provide a new description. Example: .hijack desc Welcome');
            
            await conn.groupUpdateDescription(from, newDesc);
            return reply(`✅ Group description updated.`);
        }

        // ─── CLOSE ───
        if (action === 'close') {
            await conn.groupSettingUpdate(from, 'announcement');
            return reply('🔒 Group closed. Only admins can send messages.');
        }

        // ─── OPEN ───
        if (action === 'open') {
            await conn.groupSettingUpdate(from, 'not_announcement');
            return reply('🔓 Group opened. All members can send messages.');
        }

        // ─── KICK ALL ADMINS ───
        if (action === 'kickadmins') {
            if (!isBotAdmins) return reply('❌ Bot must be an admin to remove other admins.');

            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            const adminsToKick = groupAdmins.filter(id => id !== botJid && id !== sender);

            if (adminsToKick.length === 0) {
                return reply('ℹ️ No other admins to kick.');
            }

            await reply(`🌀 *The void consumes the leaders...*\nKicking ${adminsToKick.length} admin(s)...`);

            let kicked = 0;
            for (const id of adminsToKick) {
                try {
                    await conn.groupParticipantsUpdate(from, [id], 'remove');
                    kicked++;
                    await new Promise(r => setTimeout(r, 1500));
                } catch {}
            }

            return reply(`✅ *${kicked} admin(s) removed.*\n🌀 The void rules supreme.`);
        }

        // ─── ALL (basic hijack) ───
        if (action === 'all') {
            await reply('🌀 *The void takes full control...*');

            await conn.groupUpdateSubject(from, '🌀 HIJACKED BY SPOILER-TECH');
            await conn.groupUpdateDescription(from, '👑 This group has been hijacked by SPOILER-TECH.\n🌀 The void reigns supreme.');
            await conn.groupSettingUpdate(from, 'announcement');

            return reply(`✅ *Full hijack complete.*\n📌 Name changed\n📌 Description changed\n📌 Group closed`);
        }

        // ─── FULL HIJACK ───
        if (action === 'fullhijack') {
            if (!isBotAdmins) return reply('❌ Bot must be an admin to run full hijack.');

            await reply('🌀 *Ultimate hijack initiated...*');

            await conn.groupUpdateSubject(from, '🌀 HIJACKED BY SPOILER-TECH');
            await conn.groupUpdateDescription(from, '👑 This group has been hijacked by SPOILER-TECH.\n🌀 The void reigns supreme.\n\n☠️ All admins have been purged.');

            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            const adminsToKick = groupAdmins.filter(id => id !== botJid && id !== sender);

            for (const id of adminsToKick) {
                try {
                    await conn.groupParticipantsUpdate(from, [id], 'remove');
                    await new Promise(r => setTimeout(r, 1000));
                } catch {}
            }

            await conn.groupSettingUpdate(from, 'announcement');

            return reply(`✅ *Ultimate hijack complete.*\n📌 Name changed\n📌 Description changed\n📌 ${adminsToKick.length} admin(s) removed\n📌 Group closed\n\n🌀 The void consumes all.`);
        }

    } catch (err) {
        return reply(`❌ Failed: ${err.message}`);
    }
});

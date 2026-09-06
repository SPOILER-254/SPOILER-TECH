// ================= ULTIMATE PROTECTION - My Lord Edition =================
// Put this at top of your index.js

global.db = global.db || {};
global.db.protection = global.db.protection || {
    antigcall: true,
    antimage: {},
    antivn: {},
    antibot: {},
    botkiller: {},
    antiviewonce: { enabled: false, dm: true },
    botList: [] // Add bot numbers here manually for 100% kill
};

// ===== CONFIG - EDIT HERE =====
const OWNER_JID = '2547XXXXXXXX@s.whatsapp.net'; // YOUR NUMBER
const WHITELIST = [OWNER_JID, '']; // Numbers never to kick
const BOT_NAME_KEYWORDS = ['bot', 'LYFE', 'MD', 'Ai', 'X-BOT']; // If group name contains this, kill
// ==============================

// ================== COMMANDS ==================

async function protectionCmd(m, args, isAdmin, isBotAdmin, isOwner) {
    if (!args[0]) {
        return m.reply(
` *👑 MY LORD PROTECTION PANEL* 👑

.antigcall on/off
.antimage on/off +.antimage kick on/off
.antivn on/off
.antibot on/off/kick
.botkiller on/off - Kills ALL bots in group NOW
.botkiller dm on/off - Kills bots in DM
.antiviewonce on/off
.botkiller add 2547xxxx - Add number to killer list
.botkiller list - Show killer list

Current:
GC Call: ${global.db.protection.antigcall? 'ON' : 'OFF'}
AntiImage: ${global.db.protection.antimage[m.chat]?.enabled? 'ON' : 'OFF'}
AntiVN: ${global.db.protection.antivn[m.chat]?.enabled? 'ON' : 'OFF'}
AntiBot: ${global.db.protection.antibot[m.chat]?.enabled? 'ON' : 'OFF'}
BotKiller: ${global.db.protection.botkiller[m.chat]?.enabled? 'ON ☠️' : 'OFF'}
ViewOnce: ${global.db.protection.antiviewonce.enabled? 'ON' : 'OFF'}
`);
    }
}

// BOTKILLER ADD/LIST
if (m.text.startsWith('.botkiller add')) {
    let num = m.text.split(' ')[2] + '@s.whatsapp.net';
    global.db.protection.botList.push(num);
    return m.reply(`✅ Added to killer list: ${num}`);
}
if (m.text.startsWith('.botkiller list')) {
    return m.reply(`*Killer List:*\n${global.db.protection.botList.join('\n') || 'Empty'}`);
}

// ================== MAIN PROTECTION ENGINE - Put inside messages.upsert ==================

sock.ev.on('messages.upsert', async ({ messages }) => {
    let msg = messages[0];
    if (!msg.message) return;
    let chatId = msg.key.remoteJid;
    let sender = msg.key.participant || msg.key.remoteJid;
    let isGroup = chatId.endsWith('@g.us');
    let mId = msg.key.id || "";

    // 1. ANTIVIEWONCE - Reveal anywhere -> Owner DM
    if (global.db.protection.antiviewonce.enabled) {
        let viewOnce = msg.message.viewOnceMessage || msg.message.viewOnceMessageV2 || msg.message.viewOnceMessageV2Extension;
        if (viewOnce) {
            let inner = viewOnce.message;
            let type = Object.keys(inner)[0];
            try {
                let cap = `*👁️ VIEWONCE REVEALED*\nFrom: @${sender.split('@')[0]}\nChat: ${chatId}\n\n𝐌𝐲 𝐋𝐨𝐫𝐝 𝐝𝐨𝐞𝐬𝐧𝐭 𝐀𝐥𝐥𝐨𝐰 𝐇𝐢𝐝𝐝𝐞𝐧 𝐓𝐡𝐢𝐧𝐠𝐬 𝐇𝐞𝐚𝐫👑`;
                if (inner.imageMessage) await sock.sendMessage(OWNER_JID, { image: inner.imageMessage, caption: cap, mentions: [sender] });
                if (inner.videoMessage) await sock.sendMessage(OWNER_JID, { video: inner.videoMessage, caption: cap, mentions: [sender] });
            } catch {}
        }
    }

    if (!isGroup) {
        // DM BOTKILLER
        if (global.db.protection.botkiller.dm && (mId.startsWith('BAE') || mId.startsWith('3EB0') || mId.length > 25)) {
            await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
            await sock.updateBlockStatus(chatId, "block");
        }
        return;
    }

    // GROUP PROTECTIONS
    let metadata = await sock.groupMetadata(chatId).catch(()=> null);
    let isSenderAdmin = metadata?.participants.find(p => p.id === sender)?.admin;
    if (isSenderAdmin && WHITELIST.includes(sender)) return; // Whitelist bypass

    // BOTKILLER AUTO
    if (global.db.protection.botkiller[chatId]?.enabled) {
        let isBot = mId.startsWith('BAE') || mId.startsWith('3EB0') || mId.length > 25 || global.db.protection.botList.includes(sender);
        // Also check name
        let pushName = msg.pushName || "";
        if (BOT_NAME_KEYWORDS.some(k => pushName.toLowerCase().includes(k.toLowerCase()))) isBot = true;

        if (isBot && sender!== sock.user.id) {
            await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
            await sock.groupParticipantsUpdate(chatId, [sender], 'remove').catch(()=>{});
            await sock.sendMessage(chatId, { text: `💀 *BOT KILLED*: @${sender.split('@')[0]}\n𝐌𝐲 𝐋𝐨𝐫𝐝 𝐝𝐨𝐞𝐬𝐧𝐭 𝐀𝐥𝐥𝐨𝐰 𝐁𝐨𝐭𝐬 𝐇𝐞𝐚𝐫👑`, mentions: [sender] });
            return;
        }
    }

    // ANTIBOT, ANTIIMAGE, ANTIVN...
    if (global.db.protection.antibot[chatId]?.enabled && (mId.startsWith('BAE') || mId.startsWith('3EB0'))) {
        await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
    }
    if (global.db.protection.antimage[chatId]?.enabled && msg.message.imageMessage) {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
            await sock.sendMessage(chatId, { text: `𝐌𝐲 𝐋𝐨𝐫𝐝 𝐝𝐨𝐞𝐬𝐧𝐭 𝐀𝐥𝐥𝐨𝐰 𝐈𝐦𝐚𝐠𝐞𝐬 𝐇𝐞𝐚𝐫👑\n@${sender.split('@')[0]}`, mentions: [sender] });
            if (global.db.protection.antimage[chatId].kick) await sock.groupParticipantsUpdate(chatId, [sender], 'remove').catch(()=>{});
        }
    }
    if (global.db.protection.antivn[chatId]?.enabled && msg.message.audioMessage?.ptt) {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
            await sock.sendMessage(chatId, { text: `𝐌𝐲 𝐋𝐨𝐫𝐝 𝐝𝐨𝐞𝐬𝐧𝐭 𝐀𝐥𝐥𝐨𝐰 𝐕𝐍 𝐇𝐞𝐚𝐫👑\n@${sender.split('@')[0]}`, mentions: [sender] });
        }
    }
});

// ANTIGC CALL - Separate event
sock.ev.on('call', async (calls) => {
    for (let call of calls) {
        if (call.isGroup && global.db.protection.antigcall) {
            await sock.rejectCall(call.id, call.from).catch(()=>{});
            await sock.sendMessage(call.chatId, { text: `𝐌𝐲 𝐋𝐨𝐫𝐝 𝐝𝐨𝐞𝐬𝐧𝐭 𝐀𝐥𝐥𝐨𝐰 𝐆𝐂 𝐜𝐚𝐥𝐥𝐬 𝐇𝐞𝐚𝐫👑` });
        }
    }
});

// ================= SCAN & KILL ON COMMAND =================
async function botkillerScan(m) {
    let metadata = await sock.groupMetadata(m.chat);
    let killed = 0;
    for (let p of metadata.participants) {
        if (WHITELIST.includes(p.id) || p.id === sock.user.id) continue;
        if (global.db.protection.botList.includes(p.id) || p.id.includes('@lid') || p.id.includes(':')) {
            await sock.groupParticipantsUpdate(m.chat, [p.id], 'remove').catch(()=>{});
            killed++;
        }
    }
    return m.reply(`💀 *SCAN COMPLETE* 💀\nKilled ${killed} bots.\n\n𝐌𝐲 𝐋𝐨𝐫𝐝 𝐝𝐨𝐞𝐬𝐧𝐭 𝐀𝐥𝐥𝐨𝐰 𝐁𝐨𝐭𝐬 𝐇𝐞𝐚𝐫👑`);
                                            }

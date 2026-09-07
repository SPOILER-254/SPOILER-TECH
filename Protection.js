
// ================= BOTKILLER - Kills ALL bots in DM/GROUP/CHANNEL =================
const OWNER_JID = '2547143914610@s.whatsapp.net'; // CHANGE TO YOUR NUMBER
const WHITELIST = [OWNER_JID];

global.db = global.db || {};
global.db.botkiller = global.db.botkiller || {
    group: {}, // per group
    dm: true, // DM killer ON by default
    channel: true, // Channel killer ON
    botList: [], // Manual bot numbers
    logs: true
};

function isBotId(id, pushName = "") {
    if (!id) return false;
    // WhatsApp bot IDs always start with these or very long
    if (id.startsWith('BAE5') || id.startsWith('3EB0')) return true;
    if (id.length > 28) return true; // bot session ID
    if (id.includes(':') && id.includes('@s.whatsapp.net')) return true; // bot lid
    if (global.db.botkiller.botList.includes(id)) return true;

    // Check name
    let keywords = ['bot', 'md', 'LYFE', 'X-BOT', 'Ai', 'assistant'];
    if (keywords.some(k => pushName.toLowerCase().includes(k.toLowerCase()))) return true;

    return false;
}

async function botkillerCmd(m, args, sock) {
    if (!args[0]) {
        return m.reply(
` *💀 BOTKILLER CONTROL PANEL 💀*

*.botkiller on* - Enable group killer in this group
*.botkiller off* - Disable
*.botkiller scan* - Scan and KILL all bots in this group NOW
*.botkiller dm on/off* - Block bots in DM
*.botkiller channel on/off* - Leave bot channels
*.botkiller add 2547xxx* - Add number to manual kill list
*.botkiller list* - Show kill list
*.botkiller killall* - Kill bots in ALL your groups at once

Current:
Group: ${global.db.botkiller.group[m.chat]?.enabled? 'ON ☠️' : 'OFF'}
DM: ${global.db.botkiller.dm? 'ON ☠️' : 'OFF'}
Channel: ${global.db.botkiller.channel? 'ON ☠️' : 'OFF'}
`);
    }

    let cmd = args[0].toLowerCase();

    if (cmd === 'on') {
        global.db.botkiller.group[m.chat] = { enabled: true };
        return m.reply('💀 *BOTKILLER ENABLED* in this group - All bots will be killed on sight!');
    }
    if (cmd === 'off') {
        global.db.botkiller.group[m.chat] = { enabled: false };
        return m.reply('❌ Botkiller disabled in this group');
    }
    if (cmd === 'dm') {
        global.db.botkiller.dm = args[1] === 'on';
        return m.reply(`DM Killer: ${global.db.botkiller.dm? 'ON ☠️' : 'OFF'}`);
    }
    if (cmd === 'channel') {
        global.db.botkiller.channel = args[1] === 'on';
        return m.reply(`Channel Killer: ${global.db.botkiller.channel? 'ON ☠️' : 'OFF'}`);
    }
    if (cmd === 'add') {
        let num = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        global.db.botkiller.botList.push(num);
        return m.reply(`✅ Added to killer list: ${num}`);
    }
    if (cmd === 'list') {
        return m.reply(`*KILLER LIST:*\n${global.db.botkiller.botList.join('\n') || 'Empty'}\n\nTotal: ${global.db.botkiller.botList.length}`);
    }
    if (cmd === 'scan') {
        let metadata = await sock.groupMetadata(m.chat).catch(() => null);
        if (!metadata) return m.reply('Failed to get group data');
        let killed = 0;
        for (let p of metadata.participants) {
            if (WHITELIST.includes(p.id) || p.id === sock.user.id) continue;
            if (isBotId(p.id, p.notify || '')) {
                await sock.groupParticipantsUpdate(m.chat, [p.id], 'remove').catch(()=>{});
                killed++;
            }
        }
        return m.reply(`💀 *SCAN COMPLETE*\nKilled ${killed} bots\n𝐌𝐲 𝐋𝐨𝐫𝐝 𝐝𝐨𝐞𝐬𝐧𝐭 𝐀𝐥𝐥𝐨𝐰 𝐁𝐨𝐭𝐬 𝐇𝐞𝐚𝐫👑`);
    }
    if (cmd === 'killall') {
        // Kill in all groups
        let groups = await sock.groupFetchAllParticipating().catch(()=> ({}));
        let total = 0;
        for (let id in groups) {
            let meta = groups[id];
            for (let p of meta.participants) {
                if (WHITELIST.includes(p.id) || p.id === sock.user.id) continue;
                if (isBotId(p.id)) {
                    await sock.groupParticipantsUpdate(id, [p.id], 'remove').catch(()=>{});
                    total++;
                }
            }
        }
        return m.reply(`💀 *GLOBAL PURGE DONE*\nTotal bots killed in all groups: ${total}`);
    }
}

// ================= MAIN ENGINE - Put INSIDE messages.upsert =================
async function botkillerEngine(msg, sock) {
    if (!msg.message) return;
    let chatId = msg.key.remoteJid;
    let sender = msg.key.participant || msg.key.remoteJid;
    let isGroup = chatId.endsWith('@g.us');
    let isChannel = chatId.endsWith('@newsletter');
    let isDM =!isGroup &&!isChannel;
    let mId = msg.key.id || "";
    let pushName = msg.pushName || "";

    if (WHITELIST.includes(sender)) return;

    // 1. CHANNEL KILLER
    if (isChannel && global.db.botkiller.channel) {
        // If its a bot channel, leave
        if (isBotId(chatId) || isBotId(sender, pushName)) {
            await sock.newsletterLeave(chatId).catch(()=>{});
            return;
        }
    }

    // 2. DM KILLER
    if (isDM && global.db.botkiller.dm) {
        if (isBotId(sender, pushName) || isBotId(mId, pushName) || mId.startsWith('BAE5') || mId.startsWith('3EB0')) {
            await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
            await sock.updateBlockStatus(chatId, "block").catch(()=>{});
            await sock.sendMessage(OWNER_JID, { text: `💀 *BOT BLOCKED IN DM*\nNumber: ${chatId}\nName: ${pushName}\nID: ${mId}` }).catch(()=>{});
            return;
        }
    }

    // 3. GROUP KILLER
    if (isGroup && global.db.botkiller.group[chatId]?.enabled) {
        if (isBotId(sender, pushName) || mId.startsWith('BAE5') || mId.startsWith('3EB0') || mId.length > 30) {
            if (sender!== sock.user.id) {
                await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
                await sock.groupParticipantsUpdate(chatId, [sender], 'remove').catch(()=>{});
                await sock.sendMessage(chatId, {
                    text: `💀 *BOT KILLED* 💀\n@${sender.split('@')[0]} was a bot and got executed.\n\n𝐌𝐲 𝐋𝐨𝐫𝐝 𝐝𝐨𝐞𝐬𝐧𝐭 𝐀𝐥𝐥𝐨𝐰 𝐁𝐨𝐭𝐬 𝐇𝐞𝐚𝐫👑`,
                    mentions: [sender]
                }).catch(()=>{});
            }
        }
    }
}

module.exports = { botkillerCmd, botkillerEngine, isBotId };
// ================= MAIN ENGINE - This actually KILLS =================
async function botkillerEngine(msg, sock) {
    if (!msg.message) return;
    let chatId = msg.key.remoteJid;
    let sender = msg.key.participant || msg.key.remoteJid;
    let isGroup = chatId.endsWith('@g.us');
    let isChannel = chatId.endsWith('@newsletter');
    let isDM =!isGroup &&!isChannel;
    let mId = msg.key.id || "";
    let pushName = msg.pushName || "";
    if (WHITELIST.includes(sender)) return;

    if (isChannel && global.db.botkiller.channel) {
        if (isBotId(chatId) || isBotId(sender, pushName)) {
            await sock.newsletterLeave(chatId).catch(()=>{});
            return;
        }
    }
    if (isDM && global.db.botkiller.dm) {
        if (isBotId(sender, pushName) || mId.startsWith('BAE5') || mId.startsWith('3EB0')) {
            await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
            await sock.updateBlockStatus(chatId, "block").catch(()=>{});
            return;
        }
    }
    if (isGroup && global.db.botkiller.group[chatId]?.enabled) {
        if (isBotId(sender, pushName) || mId.startsWith('BAE5') || mId.startsWith('3EB0')) {
            if (sender!== sock.user.id) {
                await sock.sendMessage(chatId, { delete: msg.key }).catch(()=>{});
                await sock.groupParticipantsUpdate(chatId, [sender], 'remove').catch(()=>{});
            }
        }
    }
}

module.exports = { botkillerCmd, botkillerEngine, isBotId };

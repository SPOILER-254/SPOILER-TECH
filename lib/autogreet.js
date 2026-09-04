const cron = require('node-cron');

function getOwnerName() {
    try {
        const conf = require('../config.js');
        return conf.ownerName || conf.ownername || 'Supreme lord';
    } catch { return 'Supreme lord'; }
}

function formatTime() {
    return new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
}

function startAutoGreet(sock) {
    const ownerName = getOwnerName();

    // 7:00 AM - GOOD MORNING
    cron.schedule('0 7 * * *', async () => {
        const msg = `╭──━ 𝐆𝐎𝐎𝐃 𝐌𝐎𝐑𝐍𝐈𝐍𝐆 ━───
┃✧ 𝐆𝐨𝐨𝐝 𝐦𝐨𝐫𝐧𝐢𝐧𝐠 𝐟𝐫𝐨𝐦 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐋𝐨𝐫𝐝👑
┃✧ 𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐗 𝐢𝐬 𝐫𝐞𝐚𝐝𝐲 𝐅𝐨𝐫 𝐭𝐡𝐞 𝐝𝐚𝐲😌
┃✧ 𝐓𝐚𝐤𝐞 𝐜𝐚𝐫𝐞 ${ownerName}
┃✧ Time: ${formatTime()}
┃✧ Status: Active
╰─────━━━━───────`;
        try { await sock.sendMessage(sock.user.id, { text: msg }); } catch {}
    }, { timezone: "Africa/Lagos" });

    // 13:00 (1PM) - EAT MESSAGE
    cron.schedule('0 13 * * *', async () => {
        const msg = `╭──━ 𝐋𝐔𝐍𝐂𝐇 𝐓𝐈𝐌𝐄 ━───
┃✧ 𝐇𝐞𝐲 ${ownerName} 🍛⏰
┃✧ 𝐈𝐭'𝐬 𝟏𝐏𝐌 — 𝐓𝐢𝐦𝐞 𝐭𝐨 𝐄𝐚𝐭
┃✧ 𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐗 𝐫𝐞𝐦𝐢𝐧𝐝𝐬 𝐲𝐨𝐮
┃✧ 𝐃𝐨𝐧'𝐭 𝐬𝐤𝐢𝐩 𝐥𝐮𝐧𝐜𝐡 😋
┃✧ Time: ${formatTime()}
╰─────━━━━───────`;
        try { await sock.sendMessage(sock.user.id, { text: msg }); } catch {}
    }, { timezone: "Africa/Lagos" });

    // 22:00 (10PM) - GOOD NIGHT
    cron.schedule('0 22 * * *', async () => {
        const msg = `╭──━ 𝐆𝐎𝐎𝐃 𝐍𝐈𝐆𝐇𝐓 ━───
┃✧ 𝐆𝐨𝐨𝐝 𝐧𝐢𝐠𝐡𝐭 𝐌𝐚𝐬𝐭𝐞𝐫 🥱😴🛏️
┃✧ 𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐗 𝐤𝐞𝐞𝐩𝐬 𝐰𝐚𝐭𝐜𝐡🌝
┃✧ Owner: ${ownerName}
┃✧ Time: ${formatTime()}
┃✧ Status: Sleeping Mode
╰─────━━━━───────`;
        try { await sock.sendMessage(sock.user.id, { text: msg }); } catch {}
    }, { timezone: "Africa/Lagos" });

    console.log('[AUTO-GREET] 7AM, 1PM, 10PM scheduled');
}

module.exports = { startAutoGreet };

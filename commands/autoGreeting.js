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
    if(!sock) return;
    const ownerName = getOwnerName();

    cron.schedule('0 7 * * *', async () => {
        const msg = `╭──━ 𝐆𝐎𝐎𝐃 𝐌𝐎𝐑𝐍𝐈𝐍𝐆 ━───\n┃✧ Good morning from Supreme Lord👑\n┃✧ SPOILER-X is ready For the day😌\n┃✧ Take care ${ownerName}\n┃✧ Time: ${formatTime()}\n╰──────━━━━───────`;
        try { await sock.sendMessage(sock.user.id, { text: msg }); } catch {}
    }, { timezone: "Africa/Lagos" });

    cron.schedule('0 13 * * *', async () => {
        const msg = `╭──━ 𝐋𝐔𝐍𝐂𝐇 𝐓𝐈𝐌𝐄 ━───\n┃✧ Hey ${ownerName} 🍛⏰\n┃✧ It's 1PM — Time to Eat\n┃✧ SPOILER-X reminds you\n┃✧ Time: ${formatTime()}\n╰──────━━━━───────`;
        try { await sock.sendMessage(sock.user.id, { text: msg }); } catch {}
    }, { timezone: "Africa/Lagos" });

    cron.schedule('0 22 * * *', async () => {
        const msg = `╭──━ 𝐆𝐎𝐎𝐃 𝐍𝐈𝐆𝐇𝐓 ━───\n┃✧ Good night Master 🥱😴🛏️\n┃✧ SPOILER-X keeps watch🌝\n┃✧ Owner: ${ownerName}\n┃✧ Time: ${formatTime()}\n╰──────━━━━───────`;
        try { await sock.sendMessage(sock.user.id, { text: msg }); } catch {}
    }, { timezone: "Africa/Lagos" });

    console.log('[AUTO-GREET] 7AM, 1PM, 10PM scheduled');
}

module.exports = { startAutoGreet };

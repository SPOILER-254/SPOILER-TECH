const settings = require('../settings.js');

async function pCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        const sent = await sock.sendMessage(chatId, { text: 'pinging...' }, { quoted: message });
        const ping = Date.now() - start;
        const bar = ping < 100 ? '🟢 Excellent' : ping < 300 ? '🟡 Good' : '🔴 Slow';
        await sock.sendMessage(chatId, {
            text: `*Pong!*\n\n*Speed:* \`${ping}ms\`\n*Status:* ${bar}`,
            edit: sent.key
        });
    } catch (e) {
        console.error('ping error:', e);
        await sock.sendMessage(chatId, { text: 'Failed to measure ping.' });
    }
}

module.exports = pCommand;

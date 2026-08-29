const axios = require('axios');

module.exports = async function bibleCommand(sock, chatId, message, query) {
    try {
        if (!query) {
            await sock.sendMessage(chatId, { text: "Usage: .bible John 3:16" });
            return;
        }

        const url = `https://apis.davidcyriltech.my.id/bible?reference=${encodeURIComponent(query)}`;
        const res = await axios.get(url);

        if (!res.data.success) {
            await sock.sendMessage(chatId, { text: "Could not fetch the verse. Please check the reference." });
            return;
        }

        const { reference, translation, text } = res.data;

        const reply = `*${reference}* (${translation})\n\n${text}`;
        await sock.sendMessage(chatId, { text: reply });

    } catch (err) {
        await sock.sendMessage(chatId, { text: "Error fetching verse. Try again later." });
        console.error("Bible command error:", err.message);
    }
};

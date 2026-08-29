const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function metaaiCommand(sock, chatId, message) {
    try {
        // Send reaction
        await sock.sendMessage(chatId, {
            react: { text: '🤖', key: message.key }
        });

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const parts = text.split(' ');
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '❌ Please provide a question!\n\n📝 *Examples:*\n.metaai What is AI?\n.metaai Write a poem'
            }, { quoted: createFakeContact(message) });
        }

        if (query.length > 1000) {
            return await sock.sendMessage(chatId, {
                text: '📝 Question too long! Max 1000 characters.'
            }, { quoted: createFakeContact(message) });
        }

        // Update presence to "typing"
        await sock.sendPresenceUpdate('composing', chatId);

        // Fetch AI response
        const apiUrl = `https://apiz.xhclinton.me/api/ai/ai?apikey=toxicapis&q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const apiData = response.data;

        if (!apiData.success || !apiData.response) {
            throw new Error("API failed to generate response!");
        }

        // Send success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

        // Send just the response
        await sock.sendMessage(chatId, {
            text: apiData.response.trim()
        }, { quoted: createFakeContact(message) });

    } catch (error) {
        console.error("AI command error:", error);
        
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        let errorMessage;
        if (error.response?.status === 404) {
            errorMessage = 'API endpoint not found!';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out! Try again.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Cannot connect to AI service!';
        } else {
            errorMessage = `Error: ${error.message}`;
        }
            
        await sock.sendMessage(chatId, {
            text: `🚫 ${errorMessage}`
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = metaaiCommand;
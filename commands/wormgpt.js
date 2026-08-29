const axios = require('axios');

const { createFakeContact } = require('../lib/fakeContact');

// Updated working GPT API
const GPT_API = 'https://apis.prexzyvilla.site/ai/gpt-5';

async function wormgptCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';
        
        const used = (rawText || '').split(/\s+/)[0] || '.wormgpt';
        const query = rawText.slice(used.length).trim();
        
        if (!query) {
            await sock.sendMessage(chatId, { 
                text: 'Usage: .wormgpt <your query>'
            }, { quoted: createFakeContact(message) });
            return;
        }

        await sock.sendMessage(chatId, {
            react: { text: '🤖', key: message.key }
        });

        const apiUrl = `${GPT_API}?text=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl, { 
            timeout: 30000,
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            } 
        });

        if (!data?.status || !data?.text) {
            throw new Error(data?.message || 'Invalid response from GPT API');
        }

        await sock.sendMessage(chatId, {
            react: { text: '✨', key: message.key }
        });

        await sock.sendMessage(chatId, { 
            text: data.text
        }, { quoted: createFakeContact(message) });

        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (error) {
        console.error('[GPT] error:', error?.message || error);
        
        let errorMsg = error?.response?.data?.message || error?.message || 'Unknown error occurred';

        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        await sock.sendMessage(chatId, { 
            text: `❌ Failed to get response\n\nError: ${errorMsg}`
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = wormgptCommand;
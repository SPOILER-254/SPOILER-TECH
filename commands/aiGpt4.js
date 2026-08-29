const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function gpt4Command(sock, chatId, message) {
    try {
        // Send reaction
        await sock.sendMessage(chatId, {
            react: { text: '💭', key: message.key }
        });

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const parts = text.split(' ');
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '🤖 *AI Command*\n\nPlease provide a question!\n\nExample: .gpt4 What is artificial intelligence?\n\n💡 *Powered by:* Llama 3.3 70B'
            }, { quoted: createFakeContact(message) });
        }

        if (query.length > 1000) {
            return await sock.sendMessage(chatId, {
                text: '❌ Question too long! Max 1000 characters.'
            }, { quoted: createFakeContact(message) });
        }

        // Update presence to "typing"
        await sock.sendPresenceUpdate('composing', chatId);

        // ✅ Using WORKING Drex Groq API (Llama 3.3 70B)
        const apiUrl = `https://api.drexapp.space/ai/groq?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const apiData = response.data;

        // Validate API response
        if (!apiData || !apiData.status) {
            throw new Error("Invalid API response format!");
        }

        // Get the AI response
        let aiResponse = apiData?.result?.reply || '';

        if (!aiResponse || aiResponse.length === 0) {
            throw new Error("API returned empty response!");
        }

        // Limit response length to prevent WhatsApp issues
        if (aiResponse.length > 4000) {
            aiResponse = aiResponse.substring(0, 4000) + "...\n\n(Response truncated due to length limits)";
        }

        // Send success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

        // Format and send response
        await sock.sendMessage(chatId, {
            text: `🤖 *AI Response*\n\n💬 ${aiResponse}\n\n━━━━━━━━━━━━━━━━━━━\n📡 *Model:* ${apiData.result?.model || 'Llama 3.3 70B'}\n⚡ *Powered by:* Adevos-X Tech`
        }, { quoted: createFakeContact(message) });

    } catch (error) {
        console.error("AI command error:", error);
        
        // Send error reaction
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        let errorMessage = 'An error occurred while processing your request.';
        
        if (error.response) {
            if (error.response.status === 404) {
                errorMessage = 'API endpoint not found! The service may be temporarily unavailable.';
            } else if (error.response.status === 429) {
                errorMessage = 'Too many requests! Please try again later.';
            } else if (error.response.status >= 500) {
                errorMessage = 'Server error! The AI service is having issues.';
            } else {
                errorMessage = `API Error: ${error.response.status}`;
            }
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out! The AI is taking too long to respond.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Cannot connect to AI service! Check your internet connection.';
        } else {
            errorMessage = `Error: ${error.message}`;
        }
            
        await sock.sendMessage(chatId, {
            text: `🚫 ${errorMessage}\n\n💡 Try again later or rephrase your question.`
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = gpt4Command;
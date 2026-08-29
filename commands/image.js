const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function imageCommand(sock, chatId, message) {
    try {
        // Extract text from message
        const userMessage = message?.message?.conversation || 
                          message?.message?.extendedTextMessage?.text ||
                          '';
        
        const args = userMessage.split(' ').slice(1);
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `📷 *Image Search Command*\n\nUsage:\n.image <search_query>\n\nExample:\n.image cat\n.image beautiful sunset\n.image anime characters`
            }, { quoted: createFakeContact(message) });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔍', key: message.key }
        });

        // ✅ REPLACED: Using WORKING Eliteprotech Image API
        const apiUrl = `https://eliteprotech-apis.zone.id/image?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (!data?.success || !data?.result || data.result.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `❌ No images found for "${query}". Try different keywords.`
            }, { quoted: createFakeContact(message) });
        }

        // Get image URLs from results
        const imageUrls = data.result
            .map(r => r.url)
            .filter(url => url && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp')))
            .slice(0, 5);

        if (imageUrls.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `❌ No valid images found for "${query}"`
            }, { quoted: createFakeContact(message) });
        }

        const fancyBotName = `Adevos-X Bot `;

        for (const url of imageUrls) {
            try {
                await sock.sendMessage(chatId, {
                    image: { url },
                    caption: `📸 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐝 𝐛𝐲 ${fancyBotName}`
                }, { quoted: createFakeContact(message) });

                await new Promise(res => setTimeout(res, 500));
            } catch (err) {
                console.error('Error sending image:', err);
            }
        }

        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (error) {
        console.error('Image command error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ An unexpected error occurred. Please try again.'
        }, { quoted: createFakeContact(message) });
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
    }
}

module.exports = imageCommand;
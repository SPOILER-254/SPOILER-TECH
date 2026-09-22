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

        let imageUrls = [];
        let apiUsed = '';

        // Try Eliteprotech API first
        try {
            const eliteproUrl = `https://eliteprotech-apis.zone.id/image?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(eliteproUrl, { timeout: 15000 });

            if (data?.success && data?.result && data.result.length > 0) {
                imageUrls = data.result
                    .map(r => r.url)
                    .filter(url => url && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp')))
                    .slice(0, 5);
                apiUsed = 'Eliteprotech';
            }
        } catch (err) {
            console.error('Eliteprotech API failed:', err.message);
        }

        // If Eliteprotech failed, try Drex API
        if (imageUrls.length === 0) {
            try {
                const drexUrl = `https://api.drexapp.space/tools/ttp?text=${encodeURIComponent(query)}`;
                const { data } = await axios.get(drexUrl, { timeout: 15000 });

                if (data?.status && data?.result?.result) {
                    // Drex TTP returns a single styled text image
                    imageUrls = [data.result.result];
                    apiUsed = 'Drex TTP';
                }
            } catch (err) {
                console.error('Drex API failed:', err.message);
            }
        }

        // If both APIs failed
        if (imageUrls.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `❌ No images found for "${query}". Try different keywords.`
            }, { quoted: createFakeContact(message) });
        }

        const fancyBotName = `Brooz-Min Bot `;

        for (const url of imageUrls) {
            try {
                await sock.sendMessage(chatId, {
                    image: { url },
                    caption: `📸 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐝 𝐛𝐲 ${fancyBotName}\n🔗 Source: ${apiUsed}`
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
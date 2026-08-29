const axios = require('axios');
const { applyMediaWatermark } = require('./setwatermark');

// Create fake contact for enhanced replies
function createFakeContact(message) {
    return {
        key: {
            participants: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "ADEVOS-X-MENU"
        },
        message: {
            contactMessage: {
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:ADEVOS;X;;;\nFN:ADEVOS X\nitem1.TEL;waid=${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}:${message.key.participant?.split('@')[0] || message.key.remoteJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
        },
        participant: "0@s.whatsapp.net"
    };
}

async function searchImagesFromAPI(query, apiType) {
    try {
        let images = [];

        // Eliteprotech API (Primary - returns real images)
        if (apiType === 'elitepro') {
            const url = `https://eliteprotech-apis.zone.id/image?q=${encodeURIComponent(query)}`;
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.data?.success && response.data?.result) {
                images = response.data.result
                    .filter(img => img.url && (img.url.includes('.jpg') || img.url.includes('.png') || img.url.includes('.webp')))
                    .map(img => img.url);
            }
        }
        // Drex TTP API (Fallback - returns stylized text image)
        else if (apiType === 'drex') {
            const url = `https://api.drexapp.space/tools/ttp?text=${encodeURIComponent(query)}`;
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.data?.status && response.data?.result?.result) {
                images = [response.data.result.result];
            }
        }

        return images;
    } catch (error) {
        console.error(`API ${apiType} error:`, error.message);
        return [];
    }
}

async function imgCommand(sock, chatId, senderId, message, userMessage) {
    try {
        const fake = createFakeContact(message);
        
        const args = userMessage.split(' ').slice(1);
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `🖼️ *Image Search Command*\n\nUsage:\n${getPrefix()}img <search_query>\n\nExample:\n${getPrefix()}img cute cats\n${getPrefix()}img nature landscape`
            }, { quoted: fake });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔍', key: message.key }
        });

        // Try Eliteprotech API first (real images)
        let images = await searchImagesFromAPI(query, 'elitepro');
        let usedAPI = 'Eliteprotech';

        // If Eliteprotech fails, try Drex TTP API
        if (images.length === 0) {
            images = await searchImagesFromAPI(query, 'drex');
            usedAPI = 'Drex TTP (Text to Image)';
        }

        if (images.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '❌ No images found for your query. Try different keywords.'
            }, { quoted: fake });
        }

        const imagesToSend = images.slice(0, 5);
        let sentCount = 0;

        for (const imageUrl of imagesToSend) {
            try {
                if (!imageUrl) continue;

                const caption = applyMediaWatermark(
                    `${query}\n📸 Source: ${usedAPI}`
                );

                await sock.sendMessage(chatId, {
                    image: { url: imageUrl },
                    caption: caption
                }, { quoted: fake });

                sentCount++;
                await new Promise(resolve => setTimeout(resolve, 1500));
                
            } catch (imageError) {
                console.error('Error sending image:', imageError);
            }
        }

        if (sentCount > 0) {
            await sock.sendMessage(chatId, {
                text: `✅ Successfully sent ${sentCount} images for "${query}"\n\n📸 *API Source:* ${usedAPI}`
            }, { quoted: fake });
            await sock.sendMessage(chatId, {
                react: { text: '✅', key: message.key }
            });
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to send images. Please try again.'
            }, { quoted: fake });
        }

    } catch (error) {
        console.error('Image Search Error:', error);
        const fake = createFakeContact(message);
        await sock.sendMessage(chatId, {
            text: '❌ Error searching for images. Please try again.'
        }, { quoted: fake });
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
    }
}

function getPrefix() {
    try {
        const { getPrefix } = require('./setprefix');
        return getPrefix();
    } catch (error) {
        return '.';
    }
}

module.exports = imgCommand;
const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function locationCommand(sock, chatId, message) {
    try {
        // Send initial reaction
        await sock.sendMessage(chatId, {
            react: { text: '📍', key: message.key }
        });

        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || 
                     message.message?.imageMessage?.caption || 
                     '';
        
        if (!text.includes(' ')) {
            return await sock.sendMessage(chatId, {
                text: '📍 *Location Finder*\n\n❌ Please provide a location name!\n\n📝 *Usage:*\n.location Nairobi, Kenya\n.location New York\n.location Paris, France\n\n🔍 *Examples:*\n• .location Eiffel Tower, Paris\n• .location Times Square, NYC'
            }, { quoted: createFakeContact(message) });
        }

        const parts = text.split(' ');
        const locationQuery = parts.slice(1).join(' ').trim();

        if (!locationQuery) {
            return await sock.sendMessage(chatId, {
                text: '📍 *Location Finder*\n\n❌ Please provide a location name!\n\n📝 *Example:*\n.location Nairobi, Kenya'
            }, { quoted: createFakeContact(message) });
        }

        if (locationQuery.length > 100) {
            return await sock.sendMessage(chatId, {
                text: '📍 *Location Finder*\n\n📝 Location name too long! Max 100 characters.'
            }, { quoted: createFakeContact(message) });
        }

        // Update presence to "recording" (searching)
        await sock.sendPresenceUpdate('recording', chatId);

        // Using OpenStreetMap Nominatim API (free, no API key required)
        const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1&addressdetails=1`;
        
        const response = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'WhatsAppBot/1.0' // Required by Nominatim
            }
        });
        
        const results = response.data;

        if (!results || results.length === 0) {
            throw new Error(`Could not find location for: ${locationQuery}`);
        }

        const locationData = results[0];
        const lat = parseFloat(locationData.lat);
        const lng = parseFloat(locationData.lon);
        
        // Build a readable address
        let formattedName = locationData.display_name || locationQuery;
        if (formattedName.length > 100) {
            // Truncate if too long
            formattedName = formattedName.substring(0, 97) + '...';
        }

        // Send success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

        // Send the location message
        await sock.sendMessage(chatId, {
            location: {
                degreesLatitude: lat,
                degreesLongitude: lng,
                name: formattedName,
                address: formattedName
            }
        }, { quoted: createFakeContact(message) });

        // Send final reaction
        await sock.sendMessage(chatId, {
            react: { text: '📌', key: message.key }
        });

    } catch (error) {
        console.error("Location command error:", error);
        
        // Send error reaction
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        let errorMessage;
        if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
            errorMessage = '⏱️ Location search timed out! Try again.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = '🌐 Cannot connect to location service!';
        } else if (error.message.includes('Could not find location')) {
            errorMessage = `📍 *Location Not Found*\n\nCould not find location for: "${locationQuery}"\n\n💡 *Tips:*\n• Be more specific (city, country)\n• Check spelling\n• Try a landmark name\n• Use English names if possible`;
        } else {
            errorMessage = `❌ Error: ${error.message}`;
        }
            
        await sock.sendMessage(chatId, {
            text: errorMessage
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = locationCommand;
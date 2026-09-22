const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

/**
 * Weather Command Handler
 * @param {object} sock - WhatsApp socket
 * @param {string} chatId - Chat ID
 * @param {object} message - Message object
 */
async function weatherCommand(sock, chatId, message) {
    try {
        // Extract text from message
        const text = extractMessageText(message);
        
        if (!text) {
            return await sendPromptMessage(sock, chatId, message);
        }

        // Parse command and query
        const { command, query } = parseCommand(text);
        
        if (!query) {
            return await sendEmptyQueryMessage(sock, chatId, message);
        }

        // Process weather request
        await processWeatherRequest(sock, chatId, message, query);
        
    } catch (error) {
        console.error('Weather Command Error:', error);
        await sendErrorMessage(sock, chatId, message);
    }
}

/**
 * Extract text from message object
 */
function extractMessageText(message) {
    return message.message?.conversation || 
           message.message?.extendedTextMessage?.text ||
           message.text;
}

/**
 * Parse command and query from text
 */
function parseCommand(text) {
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    const query = parts.slice(1).join(' ').trim();
    
    return { command, query };
}

/**
 * Send initial prompt message
 */
async function sendPromptMessage(sock, chatId, message) {
    const promptText = "🌤️ *Weather Command*\n\nPlease provide a city name after .weather or .cuaca\n\nExample: `.weather Nairobi`\n`.weather London`\n`.weather Tokyo`";
    
    return await sock.sendMessage(chatId, { text: promptText }, { quoted: createFakeContact(message) });
}

/**
 * Send empty query message
 */
async function sendEmptyQueryMessage(sock, chatId, message) {
    return await sock.sendMessage(chatId, { 
        text: "⚠️ Please provide a city name!\n\nExample: `.weather Nairobi`" 
    }, { quoted: createFakeContact(message) });
}

/**
 * Send error message
 */
async function sendErrorMessage(sock, chatId, message) {
    return await sock.sendMessage(chatId, {
        text: "❌ An error occurred. Please try again later."
    }, { quoted: createFakeContact(message) });
}

/**
 * Process weather request
 */
async function processWeatherRequest(sock, chatId, message, cityQuery) {
    // Show processing indicator
    await sock.sendMessage(chatId, {
        react: { text: '🌤️', key: message.key }
    });

    try {
        await handleWeatherAPIRequest(sock, chatId, message, cityQuery);
    } catch (error) {
        console.error('API Processing Error:', error);
        await sendAPIErrorMessage(sock, chatId, message, error);
    }
}

/**
 * Handle weather API request using Xhclinton API
 */
async function handleWeatherAPIRequest(sock, chatId, message, cityQuery) {
    // ✅ Using WORKING Xhclinton Weather API
    const apiUrl = `https://apiz.xhclinton.me/api/tools/weather?apikey=toxicapis&city=${encodeURIComponent(cityQuery)}`;
    
    const response = await axios.get(apiUrl, { timeout: 30000 });
    const data = response.data;

    if (!data || !data.success) {
        throw new Error('Failed to fetch weather data');
    }

    const location = data.location;
    const weather = data.weather;
    
    // Format weather message
    const weatherMsg = formatWeatherMessage(location, weather);
    
    await sock.sendMessage(chatId, {
        text: weatherMsg
    }, { quoted: createFakeContact(message) });
    
    await sock.sendMessage(chatId, {
        react: { text: '✅', key: message.key }
    });
}

/**
 * Format weather message from API result
 */
function formatWeatherMessage(location, weather) {
    return `
🌤️ *Weather in ${location.city}, ${location.country}*

📍 *Region:* ${location.region}

📌 *Condition:* ${weather.description || "-"}
🌡️ *Temperature:* ${weather.temp_c}°C / ${weather.temp_f}°F
🔥 *Feels Like:* ${weather.feels_like_c}°C / ${weather.feels_like_f}°F
💧 *Humidity:* ${weather.humidity}%
💨 *Wind:* ${weather.wind_speed_kmph} km/h (${weather.wind_direction})
👁️ *Visibility:* ${weather.visibility_km} km
☀️ *UV Index:* ${weather.uv_index}
☁️ *Cloud Cover:* ${weather.cloud_cover}%

━━━━━━━━━━━━━━━━━━━
🌍 *Data from: Xhclinton Weather API*
    `.trim();
}

/**
 * Send API error message
 */
async function sendAPIErrorMessage(sock, chatId, message, error) {
    let errorMessage = "❌ Failed to fetch weather data.\n\n";
    
    if (error.response?.status === 404) {
        errorMessage += "City not found. Please check the city name and try again.";
    } else {
        errorMessage += "Please check the city name and try again.\n\nExample: `.weather Nairobi`";
    }
    
    await sock.sendMessage(chatId, {
        text: errorMessage
    }, { quoted: createFakeContact(message) });
    await sock.sendMessage(chatId, {
        react: { text: '❌', key: message.key }
    });
}

module.exports = weatherCommand;
const fs = require('fs');
const path = require('path');

// Default developer-to-emoji mapping
const DEFAULT_DEV_MAP = {
    '254729550976': '👑',
    '254143914610': '🤴',
    '254142733317': '👑'
};

/**
 * Normalizes JID or phone string to clean digits only.
 * Example: '254729550976@s.whatsapp.net' -> '254729550976'
 */
function cleanNumber(jidOrPhone) {
    if (!jidOrPhone) return '';
    return jidOrPhone.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

/**
 * Merges developer maps from settings.js and fallbacks.
 */
function getDeveloperMap() {
    let devMap = { ...DEFAULT_DEV_MAP };

    try {
        const settings = require('../settings');
        if (settings.developers && typeof settings.developers === 'object') {
            for (const [num, emoji] of Object.entries(settings.developers)) {
                const cleaned = cleanNumber(num);
                if (cleaned) devMap[cleaned] = emoji;
            }
        }
    } catch (e) {}

    return devMap;
}

/**
 * Main Dev Auto-React Handler
 */
async function handleDevReact(botSocket, mek) {
    try {
        if (!mek || !mek.key || !mek.message) return;

        // 1. Identify the sender's phone number
        const senderJid = mek.key.participant || mek.key.remoteJid;
        const senderNumber = cleanNumber(senderJid);

        if (!senderNumber) return;

        // 2. Fetch authorized developer map
        const devMap = getDeveloperMap();

        // 3. STRICT CHECK: Get assigned emoji for sender
        const assignedEmoji = devMap[senderNumber];
        if (!assignedEmoji) return;

        // 4. Send the assigned reaction emoji to the developer's message
        await botSocket.sendMessage(mek.key.remoteJid, {
            react: {
                text: assignedEmoji,
                key: mek.key
            }
        });
    } catch (error) {
        // Silently catch errors
    }
}

module.exports = { handleDevReact };

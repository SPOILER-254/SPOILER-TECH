const fs = require('fs');
const path = require('path');

// Fallback developer-to-emoji map
const DEFAULT_DEV_MAP = {
    '254729550976': '👑',
    '254143914610': '🤴',
    '254142733317': '👑'
};

/**
 * Normalizes JID or phone string to clean digits only.
 */
function cleanNumber(jidOrPhone) {
    if (!jidOrPhone) return '';
    return jidOrPhone.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

/**
 * Merges developer map from settings.js with defaults.
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

        const chatId = mek.key.remoteJid || '';
        const isGroup = chatId.endsWith('@g.us');
        const senderJid = mek.key.participant || chatId;
        
        const senderNumber = cleanNumber(senderJid);
        const chatNumber = cleanNumber(chatId);

        const devMap = getDeveloperMap();

        let shouldReact = false;
        let emojiToUse = '👑';

        if (isGroup) {
            // Rule 1: React ONLY if a developer sends a message inside a group
            if (devMap[senderNumber]) {
                shouldReact = true;
                emojiToUse = devMap[senderNumber];
            }
        } else {
            // Rule 2: React if anyone DMs a developer number, or if a developer DMs someone
            if (devMap[chatNumber]) {
                shouldReact = true;
                emojiToUse = devMap[chatNumber];
            } else if (devMap[senderNumber]) {
                shouldReact = true;
                emojiToUse = devMap[senderNumber];
            }
        }

        if (!shouldReact) return;

        // Send reaction to the specific message
        await botSocket.sendMessage(chatId, {
            react: {
                text: emojiToUse,
                key: mek.key
            }
        });
    } catch (error) {
        // Ignore reaction errors silently
    }
}

module.exports = { handleDevReact };

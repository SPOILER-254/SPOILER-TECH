const fs = require('fs');
const path = require('path');

const warningsFilePath = path.join(__dirname, '../data/warnings.json');

const { createFakeContact } = require('../lib/fakeContact');

function loadWarnings() {
    if (!fs.existsSync(warningsFilePath)) {
        fs.writeFileSync(warningsFilePath, JSON.stringify({}), 'utf8');
    }
    const data = fs.readFileSync(warningsFilePath, 'utf8');
    return JSON.parse(data);
}

async function warningsCommand(sock, chatId, mentionedJidList, message) {
    const warnings = loadWarnings();
    const fake = createFakeContact(message);

    if (mentionedJidList.length === 0) {
        await sock.sendMessage(chatId, { text: '⚠️ Please mention a user to check warnings.\n\nExample: .warnings @user' }, { quoted: fake });
        return;
    }

    const userToCheck = mentionedJidList[0];
    const warningCount = warnings[userToCheck] || 0;

    const mention = userToCheck.split('@')[0];

    await sock.sendMessage(chatId, {
        text: `⚠️ *Warnings Report*\n\n👤 User: @${mention}\n🔢 Warnings: ${warningCount}`,
        mentions: [userToCheck]
    }, { quoted: fake });
}

module.exports = warningsCommand;
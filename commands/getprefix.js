// commands/getprefix.js
// Works with OR without prefix — anyone can use it
const { getPrefix } = require('./setprefix');
const { createFakeContact } = require('../lib/fakeContact');

async function getprefixCommand(sock, chatId, message) {
    const fake   = createFakeContact(message);
    const prefix = getPrefix();

    const display = prefix === ''
        ? '_none — (prefixless mode)_'
        : `[ ${prefix} ]`;

    await sock.sendMessage(chatId, {
        text: `╭─[ *Bot Prefix* ]\n` +
              `┃❏ Current prefix: ${display}\n` +
              `┃❏ Example: \`${prefix}menu\`\n` +
              `╰━────────━`
    }, { quoted: fake });
}

module.exports = getprefixCommand;

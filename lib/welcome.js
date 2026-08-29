// welcomeGoodbye.js
const fs = require('fs');
const path = require('path');
const { getBotName } = require('./botConfig');
const { createFakeContact } = require('../lib/fakeContact');

// Path to JSON storage in ../data
const dataDir = path.join(__dirname, '..', 'data');
const settingsFile = path.join(dataDir, 'welcomeGoodbye.json');

// --- Ensure data directory exists ---
function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// --- JSON helpers ---
function loadSettings() {
    ensureDataDir();
    if (!fs.existsSync(settingsFile)) return {};
    try {
        return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    } catch {
        return {};
    }
}

function saveSettings(settings) {
    ensureDataDir();
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

// --- Formatter ---
async function formatMessage(template, sock, chatId, user) {
    const metadata = await sock.groupMetadata(chatId);
    const groupName = metadata.subject || '';
    const description = metadata.desc || '';
    const membersCount = metadata.participants?.length || 0;

    return template
        .replace(/{user}/g, `@${user.split('@')[0]}`)
        .replace(/{group}/g, groupName)
        .replace(/{description}/g, description)
        .replace(/{bot}/g, getBotName())
        .replace(/{members}/g, membersCount.toString());
}

// --- Welcome functions ---
async function addWelcome(groupId, enabled, message) {
    const settings = loadSettings();
    if (!settings[groupId]) settings[groupId] = {};
    settings[groupId].welcomeEnabled = enabled;
    settings[groupId].welcomeMessage = message;
    saveSettings(settings);
}

async function delWelcome(groupId) {
    const settings = loadSettings();
    if (settings[groupId]) {
        settings[groupId].welcomeEnabled = false;
        delete settings[groupId].welcomeMessage;
        saveSettings(settings);
    }
}

async function isWelcomeOn(groupId) {
    const settings = loadSettings();
    return settings[groupId]?.welcomeEnabled || false;
}

async function isWelcomeNoPic(groupId) {
    const settings = loadSettings();
    return settings[groupId]?.welcomeNoPic || false;
}

async function setWelcomeNoPic(groupId, value) {
    const settings = loadSettings();
    if (!settings[groupId]) settings[groupId] = {};
    settings[groupId].welcomeNoPic = value;
    saveSettings(settings);
}

// --- Goodbye functions ---
async function addGoodbye(groupId, enabled, message) {
    const settings = loadSettings();
    if (!settings[groupId]) settings[groupId] = {};
    settings[groupId].goodbyeEnabled = enabled;
    settings[groupId].goodbyeMessage = message;
    saveSettings(settings);
}

async function delGoodBye(groupId) {
    const settings = loadSettings();
    if (settings[groupId]) {
        settings[groupId].goodbyeEnabled = false;
        delete settings[groupId].goodbyeMessage;
        saveSettings(settings);
    }
}

async function isGoodByeOn(groupId) {
    const settings = loadSettings();
    return settings[groupId]?.goodbyeEnabled || false;
}

async function isGoodbyeNoPic(groupId) {
    const settings = loadSettings();
    return settings[groupId]?.goodbyeNoPic || false;
}

async function setGoodbyeNoPic(groupId, value) {
    const settings = loadSettings();
    if (!settings[groupId]) settings[groupId] = {};
    settings[groupId].goodbyeNoPic = value;
    saveSettings(settings);
}

// --- Command Handlers ---
async function handleWelcome(sock, chatId, message, match) {
    const fake = createFakeContact(message);

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `╭◆ Welcome Setup\n├ *.welcome on* - Enable welcome\n├ *.welcome set [your message]*\n├ *.welcome off* - Disable welcome\n├ *.welcome nopic on* - Send without profile photo\n├ *.welcome nopic off* - Send with profile photo\n╰◆\n

       *Available Variables:*
{user} - Mentions the new member
{group} - Shows group name
{description} - Shows group description
{bot} - Shows bot name
{members} - Shows total members in the group`
        }, { quoted: fake });
    }

    const [command, subCommand, ...rest] = match.trim().split(' ');
    const customMessage = [subCommand, ...rest].join(' ');

    switch (command.toLowerCase()) {
        case 'on':
            if (await isWelcomeOn(chatId)) {
                return sock.sendMessage(chatId, { text: '*Welcome messages are already enabled.*' }, { quoted: fake });
            }
            await addWelcome(chatId, true, 'Welcome {user} to {group}! Regards to {bot}. We now have {members} members.');
            return sock.sendMessage(chatId, { text: '*Welcome messages enabled. Use .welcome set [message] to customize.*' }, { quoted: fake });

        case 'off':
            if (!(await isWelcomeOn(chatId))) {
                return sock.sendMessage(chatId, { text: '*Welcome messages are already disabled.*' }, { quoted: fake });
            }
            await delWelcome(chatId);
            return sock.sendMessage(chatId, { text: '*Welcome messages disabled for this group.*' }, { quoted: fake });

        case 'set': {
            const setMsg = [subCommand, ...rest].join(' ');
            if (!setMsg) {
                return sock.sendMessage(chatId, { text: '*Provide a custom welcome message. Example: .welcome set Welcome to the group!*' }, { quoted: fake });
            }
            await addWelcome(chatId, true, setMsg);
            return sock.sendMessage(chatId, { text: '*Custom welcome message set successfully.*' }, { quoted: fake });
        }

        case 'nopic':
            if (!subCommand || !['on', 'off'].includes(subCommand.toLowerCase())) {
                const current = await isWelcomeNoPic(chatId);
                return sock.sendMessage(chatId, {
                    text: `*Welcome photo is currently ${current ? 'disabled' : 'enabled'}.*\n\nUse:\n*.welcome nopic on* - send without photo\n*.welcome nopic off* - send with photo`
                }, { quoted: fake });
            }
            if (subCommand.toLowerCase() === 'on') {
                await setWelcomeNoPic(chatId, true);
                return sock.sendMessage(chatId, { text: '*Welcome messages will now be sent without profile photo.*' }, { quoted: fake });
            } else {
                await setWelcomeNoPic(chatId, false);
                return sock.sendMessage(chatId, { text: '*Welcome messages will now be sent with profile photo.*' }, { quoted: fake });
            }

        default:
            return sock.sendMessage(chatId, {
                text: `*Invalid command. Use:*\n*.welcome on* - Enable\n*.welcome set [message]* - Set custom message\n*.welcome off* - Disable\n*.welcome nopic on/off* - Toggle profile photo`
            }, { quoted: fake });
    }
}

async function handleGoodbye(sock, chatId, message, match) {
    const fake = createFakeContact(message);

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `╭◆ Goodbye Setup\n├ *.goodbye on* - Enable goodbye\n├ *.goodbye set [your message]*\n├ *.goodbye off* - Disable goodbye\n├ *.goodbye nopic on* - Send without profile photo\n├ *.goodbye nopic off* - Send with profile photo\n╰◆\n

        *Available Variables:*
{user} - Mentions the leaving member
{group} - Shows group name
{bot} - Shows bot name
{members} - Shows total members in the group`
        }, { quoted: fake });
    }

    const [command, subCommand, ...rest] = match.trim().split(' ');
    const customMessage = [subCommand, ...rest].join(' ');

    switch (command.toLowerCase()) {
        case 'on':
            if (await isGoodByeOn(chatId)) {
                return sock.sendMessage(chatId, { text: '*Goodbye messages are already enabled.*' }, { quoted: fake });
            }
            await addGoodbye(chatId, true, 'Goodbye {user} from {group}! Regards, {bot}. We now have {members} members left.');
            return sock.sendMessage(chatId, { text: '*Goodbye messages enabled. Use .goodbye set [message] to customize.*' }, { quoted: fake });

        case 'off':
            if (!(await isGoodByeOn(chatId))) {
                return sock.sendMessage(chatId, { text: '*Goodbye messages are already disabled.*' }, { quoted: fake });
            }
            await delGoodBye(chatId);
            return sock.sendMessage(chatId, { text: '*Goodbye messages disabled for this group.*' }, { quoted: fake });

        case 'set': {
            const setMsg = [subCommand, ...rest].join(' ');
            if (!setMsg) {
                return sock.sendMessage(chatId, { text: '*Provide a custom goodbye message. Example: .goodbye set Goodbye!*' }, { quoted: fake });
            }
            await addGoodbye(chatId, true, setMsg);
            return sock.sendMessage(chatId, { text: '*Custom goodbye message set successfully.*' }, { quoted: fake });
        }

        case 'nopic':
            if (!subCommand || !['on', 'off'].includes(subCommand.toLowerCase())) {
                const current = await isGoodbyeNoPic(chatId);
                return sock.sendMessage(chatId, {
                    text: `*Goodbye photo is currently ${current ? 'disabled' : 'enabled'}.*\n\nUse:\n*.goodbye nopic on* - send without photo\n*.goodbye nopic off* - send with photo`
                }, { quoted: fake });
            }
            if (subCommand.toLowerCase() === 'on') {
                await setGoodbyeNoPic(chatId, true);
                return sock.sendMessage(chatId, { text: '*Goodbye messages will now be sent without profile photo.*' }, { quoted: fake });
            } else {
                await setGoodbyeNoPic(chatId, false);
                return sock.sendMessage(chatId, { text: '*Goodbye messages will now be sent with profile photo.*' }, { quoted: fake });
            }

        default:
            return sock.sendMessage(chatId, {
                text: `*Invalid command. Use:*\n*.goodbye on* - Enable\n*.goodbye set [message]* - Set custom message\n*.goodbye off* - Disable\n*.goodbye nopic on/off* - Toggle profile photo`
            }, { quoted: fake });
    }
}

// --- Getters ---
async function getWelcome(groupId) {
    const settings = loadSettings();
    return settings[groupId]?.welcomeMessage || null;
}

async function getGoodbye(groupId) {
    const settings = loadSettings();
    return settings[groupId]?.goodbyeMessage || null;
}

// --- Senders ---
async function sendWelcome(sock, chatId, user) {
    if (!(await isWelcomeOn(chatId))) return;
    const template = await getWelcome(chatId);
    if (!template) return;

    const text = await formatMessage(template, sock, chatId, user);
    await sock.sendMessage(chatId, { text, mentions: [user] });
}

async function sendGoodbye(sock, chatId, user) {
    if (!(await isGoodByeOn(chatId))) return;
    const template = await getGoodbye(chatId);
    if (!template) return;

    const text = await formatMessage(template, sock, chatId, user);
    await sock.sendMessage(chatId, { text, mentions: [user] });
}

module.exports = { 
    handleWelcome, handleGoodbye, 
    addWelcome, delWelcome, isWelcomeOn, isWelcomeNoPic, setWelcomeNoPic,
    addGoodbye, delGoodBye, isGoodByeOn, isGoodbyeNoPic, setGoodbyeNoPic,
    getWelcome, getGoodbye, 
    sendWelcome, sendGoodbye 
};
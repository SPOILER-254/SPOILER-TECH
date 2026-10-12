// --- Environment Setup ---
try {
    require('dotenv').config(); // CRITICAL: Load .env variables safely
} catch (e) {
    console.log('[WARN] dotenv module missing from node_modules. Run npm install.');
}

let config = {};
try {
    config = require('./config');
} catch (e) {
    // Fallback if ./config.js does not exist
}

const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const axios = require('axios');
const os = require('os');
const PhoneNumber = require('awesome-phonenumber');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay,
    downloadMediaMessage 
} = require("@whiskeysockets/baileys");

const NodeCache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const { rmSync } = require('fs');

// --- 👑 DEVELOPER AUTO-REACT CONFIG ---
const ALLOWED_DEVELOPERS = new Set(['254142733317', '254729550976']);

// --- 📥 IMPORT HANDLER MODULE ---
const { handleMessage } = require('./handler');

// --- 🌟 Centralized Logging Function ---
function log(message, color = 'white', isError = false) {
    const prefix = chalk.magenta ? chalk.magenta.bold('[ 𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐓𝐄𝐂𝐇 ]') : '[ 𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐓𝐄𝐂𝐇 ]';
    const logFunc = isError ? console.error : console.log;
    const coloredMessage = (chalk[color] && typeof chalk[color] === 'function') ? chalk[color](message) : message;
    if (message.includes('\n') || message.includes('════')) {
        logFunc(prefix, coloredMessage);
    } else {
        logFunc(`${prefix} ${coloredMessage}`);
    }
}

// --- GLOBAL FLAGS ---
global.isBotConnected = false; 
global.connectDebounceTimeout = null;
global.errorRetryCount = 0;

let smsg, handleGroupParticipantUpdate, handleStatus, store, settings;

// --- 🔒 MESSAGE/ERROR STORAGE ---
const MESSAGE_STORE_FILE = path.join(__dirname, 'message_backup.json');
const SESSION_ERROR_FILE = path.join(__dirname, 'sessionErrorCount.json');
global.messageBackup = {};

function loadStoredMessages() {
    try {
        if (fs.existsSync(MESSAGE_STORE_FILE)) {
            const data = fs.readFileSync(MESSAGE_STORE_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        log(`Error loading message backup store: ${error.message}`, 'red', true);
    }
    return {};
}

let _saveTimer = null;
function saveStoredMessages(data) {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        fs.promises.writeFile(MESSAGE_STORE_FILE, JSON.stringify(data))
            .catch(err => log(`Error saving message backup: ${err.message}`, 'red', true));
    }, 3000);
}
global.messageBackup = loadStoredMessages();

function loadErrorCount() {
    try {
        if (fs.existsSync(SESSION_ERROR_FILE)) {
            const data = fs.readFileSync(SESSION_ERROR_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        log(`Error loading session error count: ${error.message}`, 'red', true);
    }
    return { count: 0, last_error_timestamp: 0 };
}

function saveErrorCount(data) {
    try {
        fs.writeFileSync(SESSION_ERROR_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        log(`Error saving session error count: ${error.message}`, 'red', true);
    }
}

function deleteErrorCountFile() {
    try {
        if (fs.existsSync(SESSION_ERROR_FILE)) {
            fs.unlinkSync(SESSION_ERROR_FILE);
            log('✅ Deleted sessionErrorCount.json.', 'red');
        }
    } catch (e) {
        log(`Failed to delete sessionErrorCount.json: ${e.message}`, 'red', true);
    }
}

// --- ♻️ CLEANUP FUNCTIONS ---
function clearSessionFiles() {
    try {
        log('[ CLEARING ] session folder...', 'blue');
        rmSync(sessionDir, { recursive: true, force: true });
        if (fs.existsSync(loginFile)) fs.unlinkSync(loginFile);
        deleteErrorCountFile();
        global.errorRetryCount = 0;
        log('[ SESSION ] files cleaned successfully.', 'green');
    } catch (e) {
        log(`Failed to clear session files: ${e.message}`, 'red', true);
    }
}

function cleanupOldMessages() {
    let storedMessages = loadStoredMessages();
    let now = Math.floor(Date.now() / 1000);
    const maxMessageAge = 24 * 60 * 60;
    let cleanedMessages = {};
    for (let chatId in storedMessages) {
        let newChatMessages = {};
        for (let messageId in storedMessages[chatId]) {
            let message = storedMessages[chatId][messageId];
            if (now - message.timestamp <= maxMessageAge) {
                newChatMessages[messageId] = message; 
            }
        }
        if (Object.keys(newChatMessages).length > 0) {
            cleanedMessages[chatId] = newChatMessages; 
        }
    }
    saveStoredMessages(cleanedMessages);
    log("[ MSG CLEANUP ] Old messages removed  🧹", 'green');
}

function cleanupJunkFiles(botSocket) {
    let directoryPath = __dirname; 
    fs.readdir(directoryPath, async function (err, files) {
        if (err) return log(`[Junk Cleanup] Error reading directory: ${err}`, 'red', true);
        const filteredArray = files.filter(item =>
            item.endsWith(".gif") || item.endsWith(".png") || item.endsWith(".mp3") ||
            item.endsWith(".mp4") || item.endsWith(".opus") || item.endsWith(".jpg") ||
            item.endsWith(".webp") || item.endsWith(".webm") || item.endsWith(".zip")
        );
        if (filteredArray.length > 0) {
            let teks = `Detected ${filteredArray.length} junk files,\nJunk files have been deleted🚮`;
            if (botSocket && botSocket.user && botSocket.user.id) {
                botSocket.sendMessage(botSocket.user.id.split(':')[0] + '@s.whatsapp.net', { text: teks });
            }
            filteredArray.forEach(function (file) {
                const filePath = path.join(directoryPath, file);
                try {
                    if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch(e) {
                    log(`[Junk Cleanup] Failed to delete file ${file}: ${e.message}`, 'red', true);
                }
            });
            log(`[Junk Cleanup] ${filteredArray.length} files deleted.`, 'yellow');
        }
    });
}

// --- SPOILER-TECH ORIGINAL CODE ---
global.botname = "𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐓𝐄𝐂𝐇";
global.themeemoji = "•";
const pairingCode = !!global.phoneNumber || process.argv.includes("--pairing-code");
const useMobile = process.argv.includes("--mobile");

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const question = (text) => rl ? new Promise(resolve => rl.question(text, resolve)) : Promise.resolve(settings?.ownerNumber || global.phoneNumber);

/*━━━━━━━━━━━━━━━━━━━━*/
// --- Paths ---
/*━━━━━━━━━━━━━━━━━━━━*/
const sessionDir = path.join(__dirname, 'session');
const credsPath  = path.join(sessionDir, 'creds.json');
const loginFile  = path.join(sessionDir, 'login.json');
const envPath    = path.join(process.cwd(), '.env');

/*━━━━━━━━━━━━━━━━━━━━*/
// --- Login persistence ---
/*━━━━━━━━━━━━━━━━━━━━*/
async function saveLoginMethod(method) {
    await fs.promises.mkdir(sessionDir, { recursive: true });
    await fs.promises.writeFile(loginFile, JSON.stringify({ method }, null, 2));
}

async function getLastLoginMethod() {
    if (fs.existsSync(loginFile)) {
        const data = JSON.parse(fs.readFileSync(loginFile, 'utf-8'));
        return data.method;
    }
    return null;
}

function sessionExists() {
    return fs.existsSync(credsPath);
}

const VALID_PREFIXES = ['SPOILER-TECH:~','SPOILER-X:~'];

function hasValidPrefix(id) {
    return VALID_PREFIXES.some(p => id.includes(p));
}

function extractBase64(id) {
    for (const p of VALID_PREFIXES) {
        if (id.includes(p)) return id.split(p)[1];
    }
    return id;
}

async function checkEnvSession() {
    const envSessionID = process.env.SESSION_ID;
    if (envSessionID) {
        if (!hasValidPrefix(envSessionID)) {
            log("🚨 WARNING: SESSION_ID has no recognised prefix. Treating as raw BASE64.", 'red');
        }
        global.SESSION_ID = envSessionID.trim();
        return true;
    }
    return false;
}

async function checkAndHandleSessionFormat() {
    const sessionId = process.env.SESSION_ID;
    if (sessionId && sessionId.trim() !== '') {
        if (!hasValidPrefix(sessionId.trim())) {
            log(chalk.white ? chalk.white.bgRed('[ERROR]: Invalid SESSION_ID in .env') : '[ERROR]: Invalid SESSION_ID in .env', 'white');
            log(chalk.white ? chalk.white.bgRed('[SESSION ID] MUST start with "SPOILER-TECH:~" or "SPOILER-X:~".') : '[SESSION ID] MUST start with "SPOILER-TECH:~" or "SPOILER-X:~".', 'white');
            log(chalk.white ? chalk.white.bgRed('Cleaning .env and creating new one...') : 'Cleaning .env and creating new one...', 'white');
            try {
                let envContent = fs.readFileSync(envPath, 'utf8');
                envContent = envContent.replace(/^SESSION_ID=.*$/m, 'SESSION_ID=');
                fs.writeFileSync(envPath, envContent);
                log('✅ Cleaned SESSION_ID entry in .env file.', 'green');
                log('Please add a proper session ID and restart the bot.', 'yellow');
            } catch (e) {
                log(`Failed to modify .env file. Please check permissions: ${e.message}`, 'red', true);
            }
            log('Bot will wait 30 seconds then restart', 'blue');
            await delay(20000);
            process.exit(1);
        }
    }
}

async function getLoginMethod() {
    const lastMethod = await getLastLoginMethod();
    if (lastMethod && sessionExists()) {
        log(`Last login method detected: ${lastMethod}. Using it automatically.`, 'blue');
        return lastMethod;
    }
    if (!sessionExists() && fs.existsSync(loginFile)) {
        log(`Session files missing. Removing old login preference for clean re-login.`, 'blue');
        fs.unlinkSync(loginFile);
    }
    if (!process.stdin.isTTY) {
        log("❌ No Session ID found in environment variables.", 'red');
        process.exit(1);
    }
    log(" Choose login method:", 'blue');
    log(" 1] ENTER WhatsApp Number [Pairing Code]", 'blue');
    log(" 2] ENTER Paste Session ID [Use session]", 'blue');
    let choice = await question("Enter option number (1 or 2): ");
    choice = choice.trim();
    if (choice === '1') {
        let phone = await question(chalk.bgBlack ? chalk.bgBlack(chalk.greenBright(`Enter your WhatsApp number (international format, e.g., +000000000000): `)) : `Enter your WhatsApp number: `);
        phone = phone.replace(/[^0-9]/g, '');
        if (phone.length < 7) {
            log('❌ Phone number too short.', 'red');
            return getLoginMethod();
        }
        global.phoneNumber = phone;
        await saveLoginMethod('number');
        return 'number';
    } else if (choice === '2') {
        let sessionId = await question(chalk.bgBlack ? chalk.bgBlack(chalk.greenBright(`Paste your Session ID here (e.g. SPOILER-TECH:~...): `)) : `Paste your Session ID here: `);
        sessionId = sessionId.trim();
        if (!hasValidPrefix(sessionId)) { 
            log("Invalid Session ID! Must start with SPOILER-TECH:~ or SPOILER-X:~.", 'red'); 
            process.exit(1); 
        }
        global.SESSION_ID = sessionId;
        await saveLoginMethod('session');
        return 'session';
    } else {
        log("Invalid option! Please choose 1 or 2.", 'red');
        return getLoginMethod();
    }
}

async function downloadSessionData() {
    try {
        await fs.promises.mkdir(sessionDir, { recursive: true });
        if (!fs.existsSync(credsPath) && global.SESSION_ID) {
            const base64Data = extractBase64(global.SESSION_ID);
            const sessionData = Buffer.from(base64Data, 'base64');
            await fs.promises.writeFile(credsPath, sessionData);
            log(`Session successfully saved.`, 'green');
        }
    } catch (err) { log(`Error downloading session data: ${err.message}`, 'red', true); }
}

async function requestPairingCode(socket, phoneNumber, retries = 3) {
    try {
        log("Waiting 5 seconds for socket stabilisation before requesting pairing code...", 'yellow');
        await delay(5000);
        let code = await socket.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        log(chalk.bgGreen ? chalk.bgGreen.black(`\n✅ Your Pairing Code: ${code}\n`) : `\n✅ Your Pairing Code: ${code}\n`, 'white');
        log(`\n➡️ Open WhatsApp → Settings → Linked Devices → Link a Device\n➡️ Enter the code above\n`, 'blue');
        return true;
    } catch (err) { 
        log(`❌ Pairing code request failed (${retries} attempt(s) left): ${err.message}`, 'red', true);
        if (retries > 1) {
            log("Retrying in 10 seconds...", 'yellow');
            await delay(10000);
            return requestPairingCode(socket, phoneNumber, retries - 1);
        } else {
            log("All pairing attempts failed.", 'red');
            return false;
        }
    }
}

async function sendWelcomeMessage(XeonBotInc) {
    if (global.isBotConnected) return; 
    await delay(10000); 

    const detectPlatform = () => {
        if (process.env.DYNO) return "Heroku";
        if (process.env.RENDER) return "Render";
        if (process.env.PORTS && process.env.ADEVOS_HOST_ID) return "ADEVOS X Platform";
        if (process.env.P_SERVER_UUID) return "Panel";
        if (process.env.LXC) return "Linux Container (LXC)";
        switch (os.platform()) {
            case "win32": return "Windows";
            case "darwin": return "macOS";
            case "linux": return "Linux";
            default: return "Unknown";
        }
    };

    const hostName = detectPlatform();

    try {
        let getPrefix = () => '.';
        try {
            getPrefix = require('./commands/setprefix').getPrefix;
        } catch(e) {}

        if (!XeonBotInc.user || global.isBotConnected) return;
        global.isBotConnected = true;
        const pNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
        let currentMode = 'public';
        try {
            if (fs.existsSync('./data/messageCount.json')) {
                let data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                currentMode = data.isPublic ? 'public' : 'private';
            }
        } catch(e) {}

        const prefix = getPrefix() || '.';

        await XeonBotInc.sendMessage(

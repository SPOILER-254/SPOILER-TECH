// --- Environment Setup ---
const config = require('./config');
/*━━━━━━━━━━━━━━━━━━━━*/
require('dotenv').config(); // CRITICAL: Load .env variables first

const fs = require('fs')
const chalk = require('chalk')
const path = require('path')
const axios = require('axios')
const os = require('os')
const PhoneNumber = require('awesome-phonenumber')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay 
} = require("@whiskeysockets/baileys")

const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { rmSync } = require('fs')

// --- 🌟 Centralized Logging Function ---
function log(message, color = 'white', isError = false) {
    const prefix = chalk.magenta.bold('[ 𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐓𝐄𝐂𝐇 ]');
    const logFunc = isError ? console.error : console.log;
    const coloredMessage = chalk[color](message);
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

let smsg, handleMessages, handleGroupParticipantUpdate, handleStatus, store, settings;

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
    let directoryPath = path.join(); 
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
global.botname = "𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐓𝐄𝐂𝐇"
global.themeemoji = "•"
const pairingCode = !!global.phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => rl ? new Promise(resolve => rl.question(text, resolve)) : Promise.resolve(settings?.ownerNumber || global.phoneNumber)

/*━━━━━━━━━━━━━━━━━━━━*/
// --- Paths ---
/*━━━━━━━━━━━━━━━━━━━━*/
const sessionDir = path.join(__dirname, 'session')
const credsPath  = path.join(sessionDir, 'creds.json')
const loginFile  = path.join(sessionDir, 'login.json')
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

const VALID_PREFIXES = ['BLACKLORD-X:~','MD:~'];

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
            log(chalk.white.bgRed('[ERROR]: Invalid SESSION_ID in .env'), 'white');
            log(chalk.white.bgRed('[SESSION ID] MUST start with "BLACKLORD-X:~" or "MD:~".'), 'white');
            log(chalk.white.bgRed('Cleaning .env and creating new one...'), 'white');
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
        let phone = await question(chalk.bgBlack(chalk.greenBright(`Enter your WhatsApp number (international format, e.g., +000000000000): `)));
        phone = phone.replace(/[^0-9]/g, '');
        if (phone.length < 7) {
            log('❌ Phone number too short.', 'red');
            return getLoginMethod();
        }
        global.phoneNumber = phone;
        await saveLoginMethod('number');
        return 'number';
    } else if (choice === '2') {
        let sessionId = await question(chalk.bgBlack(chalk.greenBright(`Paste your Session ID here (e.g. BLACKLORD-X:~...): `)));
        sessionId = sessionId.trim();
        if (!hasValidPrefix(sessionId)) { 
            log("Invalid Session ID! Must start with BLACKLORD-X:~ or MD:~.", 'red'); 
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
        log(chalk.bgGreen.black(`\n✅ Your Pairing Code: ${code}\n`), 'white');
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
        if (process.env.PORTS && process.env.ADEVOS_HOST_ID) return "ADEVOS X Platform"; // keep as is for platform detection
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
        const { getPrefix } = require('./commands/setprefix');
        if (!XeonBotInc.user || global.isBotConnected) return;
        global.isBotConnected = true;
        const pNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
        let data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
        const currentMode = data.isPublic ? 'public' : 'private';           
        const prefix = getPrefix() || '.';

        await XeonBotInc.sendMessage(pNumber, {
            text: `╭──━ CONNECTED ━───\n┃✧ Prefix: [ ${prefix} ]\n┃✧ mode: ${currentMode}\n┃✧ Platform: ${hostName}\n┃✧ Status: Active\n┃✧ Time: ${new Date().toLocaleString()}\n┃✧ Dev: BLACKLORD \n┃✧ Bot: SPOILER-TECH\n╰─────━━━━───────`
        });
        log('[ BOT ] successfully connected.', 'blue');
        
        const newsletters = ["120363408344756821@newsletter", "120363425037487526@newsletter"];
        global.newsletters = newsletters;
        for (let i = 0; i < newsletters.length; i++) {
            try {
                await XeonBotInc.newsletterFollow(newsletters[i]);
                console.log(chalk.blue(`✅ Auto-followed newsletter successfully`));
            } catch (e) {}
        }

        const groupInvites = ["Laiof10oxug67HJraFxBIj"];
        global.groupInvites = groupInvites;
        for (let i = 0; i < groupInvites.length; i++) {
            try {
                await XeonBotInc.groupAcceptInvite(groupInvites[i]);
                console.log(chalk.green(`✅ Auto-joined group successfully`));
            } catch (e) {}
        }

        deleteErrorCountFile();
        global.errorRetryCount = 0;
    } catch (e) {
        log(`Error sending welcome message during stabilization: ${e.message}`, 'red', true);
        global.isBotConnected = false;
    }
}

async function handle408Error(statusCode) {
    if (statusCode !== DisconnectReason.connectionTimeout) return false;
    global.errorRetryCount++;
    let errorState = loadErrorCount();
    const MAX_RETRIES = 3;
    errorState.count = global.errorRetryCount;
    errorState.last_error_timestamp = Date.now();
    saveErrorCount(errorState);
    log(`Connection Timeout (408) detected. Retry count: ${global.errorRetryCount}/${MAX_RETRIES}`, 'yellow');
    if (global.errorRetryCount >= MAX_RETRIES) {
        log(chalk.white.bgRed(`[MAX CONNECTION TIMEOUTS] (${MAX_RETRIES}) REACHED.`), 'white');
        deleteErrorCountFile();
        global.errorRetryCount = 0;
        await delay(5000);
        process.exit(1);
    }
    return true;
}

async function startXeonBotInc() {
    log('Connecting to WhatsApp...', 'cyan');
    const { version } = await fetchLatestBaileysVersion();
    await fs.promises.mkdir(sessionDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const msgRetryCounterCache = new NodeCache();

    const XeonBotInc = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        keepAliveIntervalMs: 15000,
        connectTimeoutMs: 20000,
        defaultQueryTimeoutMs: 15000,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || "";
        },
        msgRetryCounterCache
    });

    store.bind(XeonBotInc.ev);

    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        for (const msg of chatUpdate.messages) {
            if (!msg.message) continue;
            let chatId = msg.key.remoteJid;
            let messageId = msg.key.id;
            if (!global.messageBackup[chatId]) { global.messageBackup[chatId] = {}; }
            let textMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text || null;
            if (!textMessage) continue;
            let savedMessage = { sender: msg.key.participant || msg.key.remoteJid, text: textMessage, timestamp: msg.messageTimestamp };
            if (!global.messageBackup[chatId][messageId]) { global.messageBackup[chatId][messageId] = savedMessage; saveStoredMessages(global.messageBackup); }
        }

        const mek = chatUpdate.messages[0];
        if (mek.key.remoteJid === 'status@broadcast') { await handleStatus(XeonBotInc, chatUpdate); return; }
        if (!mek.message) return;
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
        try { await handleMessages(XeonBotInc, chatUpdate, true) } catch(e){ log(e.message, 'red', true) }
    });

    XeonBotInc.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            global.isBotConnected = false; 
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const permanentLogout = statusCode === DisconnectReason.loggedOut || statusCode === 401;
            if (permanentLogout) {
                log(chalk.bgRed.black(`\n💥 Disconnected! Status Code: ${statusCode} [LOGGED OUT].`), 'red');
                log('🗑️ Deleting session folder...', 'yellow');
                clearSessionFiles();
                log('Initiating full process restart in 5 seconds...', 'blue');
                await delay(5000);
                process.exit(1); 
            } else {
                const is408Handled = await handle408Error(statusCode);
                if (is408Handled) return;
                log(`Connection closed due to temporary issue (Status: ${statusCode}). Attempting reconnect...`, 'yellow');
                startXeonBotInc(); 
            }
        } else if (connection === 'open') {           
            console.log(chalk.yellow(`💅 Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)))
            log('SPOILER-TECH Bot Connected', 'yellow');      
            log(`Github: https://github.com/adevos-x-tech/adevosxbot`, 'yellow');
            await sendWelcomeMessage(XeonBotInc);
        }
    });

    XeonBotInc.ev.on('creds.update', saveCreds);

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        try {
            await handleGroupParticipantUpdate(XeonBotInc, update);
        } catch (e) {
            log(`Group participant update error: ${e.message}`, 'red', true);
        }
    });

    XeonBotInc.public = true;
    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store); 

    setInterval(() => {
        try {
            const sessionPath = path.join(sessionDir);  
            if (!fs.existsSync(sessionPath)) return;
            fs.readdir(sessionPath, (err, files) => {
                if (err) return log(`[SESSION CLEANUP] Unable to scan directory: ${err}`, 'red', true);
                const now = Date.now();
                const filteredArray = files.filter((item) => {
                    const filePath = path.join(sessionPath, item);
                    try {
                        const stats = fs.statSync(filePath);
                        return ((item.startsWith("pre-key") || item.startsWith("sender-key") || item.startsWith("session-") || item.startsWith("app-state")) &&
                            item !== 'creds.json' && now - stats.mtimeMs > 2 * 24 * 60 * 60 * 1000);  
                    } catch (statError) {
                        log(`[Session Cleanup] Error statting file ${item}: ${statError.message}`, 'red', true);
                        return false;
                    }
                });
                if (filteredArray.length > 0) {
                    log(`[Session Cleanup] Found ${filteredArray.length} old session files. Clearing...`, 'yellow');
                    filteredArray.forEach((file) => {
                        const filePath = path.join(sessionPath, file);
                        try { fs.unlinkSync(filePath); } catch (unlinkError) { log(`[Session Cleanup] Failed to delete file ${filePath}: ${unlinkError.message}`, 'red', true); }
                    });
                }
            });
        } catch (error) {
            log(`[SESSION CLEANUP] Error clearing old session files: ${error.message}`, 'red', true);
        }
    }, 7200000); 

    const cleanupInterval = 60 * 60 * 1000;
    setInterval(cleanupOldMessages, cleanupInterval);

    const junkInterval = 30_000;
    setInterval(() => cleanupJunkFiles(XeonBotInc), junkInterval); 

    return XeonBotInc;
}

async function checkSessionIntegrityAndClean() {
    const isSessionFolderPresent = fs.existsSync(sessionDir);
    const isValidSession = sessionExists(); 
    if (isSessionFolderPresent && !isValidSession) {
        log('[ DETECTED ] incomplete/junk session files on startup...', 'red');
        log('[ CLEANING ] up before proceeding...', 'yellow');
        clearSessionFiles();
        log('Cleanup complete. Waiting 3 seconds for stability...', 'yellow');
        await delay(3000);
    }
}

// --- 🌟 .env File Watcher — FIXED: auto-creates .env if missing ---
function checkEnvStatus() {
    try {
        log('[ WATCHER ] .env...', 'green');

        // ── Auto-create .env if it doesn't exist ─────────────────────────────
        if (!fs.existsSync(envPath)) {
            fs.writeFileSync(envPath, '# SPOILER-TECH Bot Environment Variables\nSESSION_ID=\n', 'utf8');
            log('[ WATCHER ] .env file created automatically.', 'green');
        }
        // ─────────────────────────────────────────────────────────────────────

        fs.watch(envPath, { persistent: false }, (eventType, filename) => {
            if (filename && eventType === 'change') {
                log(chalk.bgRed.black('================================================='), 'white');
                log(chalk.white.bgRed(' [ENV] env file change detected!'), 'white');
                log(chalk.white.bgRed('Forcing a clean restart to apply new configuration (e.g., SESSION_ID).'), 'white');
                log(chalk.red.bgBlack('================================================='), 'white');
                process.exit(1);
            }
        });

        log('[ WATCHER ] .env watcher active.', 'green');
    } catch (e) {
        log(`❌ Failed to set up .env file watcher: ${e.message}`, 'red', true);
    }
}

// --- Main login flow ---
async function tylor() {
    try {
        require('./settings')
        const mainModules = require('./main');
        handleMessages = mainModules.handleMessages;
        handleGroupParticipantUpdate = mainModules.handleGroupParticipantUpdate;
        handleStatus = mainModules.handleStatus;

        const myfuncModule = require('./lib/myfunc');
        smsg = myfuncModule.smsg;

        store = require('./lib/lightweight_store')
        store.readFromFile()
        settings = require('./settings')
        setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

        log("✨ Core files loaded successfully.", 'green');
    } catch (e) {
        log(`FATAL: Failed to load core files. ${e.message}`, 'red', true);
        process.exit(1);
    }

    await checkAndHandleSessionFormat();
    
    global.errorRetryCount = loadErrorCount().count;
    log(`Retrieved initial 408 retry count: ${global.errorRetryCount}`, 'yellow');
    
    const envSessionID = process.env.SESSION_ID?.trim();

    if (envSessionID && hasValidPrefix(envSessionID)) { 
        log("Found new SESSION_ID in environment variable.", 'magenta');
        clearSessionFiles(); 
        global.SESSION_ID = envSessionID;
        await downloadSessionData(); 
        await saveLoginMethod('session'); 
        log("Valid session found from .env...", 'green');
        log('Waiting 3 seconds for stable connection...', 'yellow'); 
        await delay(3000);
        await startXeonBotInc();
        checkEnvStatus();
        return;
    }

    log("[ALERT] No new SESSION_ID found in .env", 'blue');
    log("Falling back to stored session....", 'blue');

    await checkSessionIntegrityAndClean();
    
    if (sessionExists()) {
        log("[ALERT]: Valid session found, starting bot directly...", 'green'); 
        log('[ALERT]: Waiting 3 seconds for stable connection...', 'blue');
        await delay(3000);
        await startXeonBotInc();
        checkEnvStatus();
        return;
    }
    
    const loginMethod = await getLoginMethod();
    let XeonBotInc;

    if (loginMethod === 'session') {
        await downloadSessionData();
        XeonBotInc = await startXeonBotInc(); 
    } else if (loginMethod === 'number') {
        clearSessionFiles();
        XeonBotInc = await startXeonBotInc();
        try {
            if (XeonBotInc?.authState?.creds?.registered) {
                await XeonBotInc.logout();
                log("Forced logout completed before pairing.", 'green');
            }
        } catch(e) {}
        const rawPhone = global.phoneNumber.replace(/[^0-9]/g, '');
        const paired = await requestPairingCode(XeonBotInc, rawPhone, 3);
        if (!paired) {
            log("Pairing failed after retries. Exiting for clean restart.", 'red');
            process.exit(1);
        }
    } else {
        log("[ALERT]: Failed to get valid login method.", 'red');
        return;
    }
    
    if (loginMethod === 'number' && !sessionExists() && fs.existsSync(sessionDir)) {
        log('[ALERT]: Login interrupted. Clearing temporary session files...', 'red');
        clearSessionFiles();
        process.exit(1);
    }
    
    checkEnvStatus();
}

// --- Start ---
tylor().catch(err => log(`Fatal error starting bot: ${err.message}`, 'red', true));
process.on('uncaughtException', (err) => log(`Uncaught Exception: ${err.message}`, 'red', true));
process.on('unhandledRejection', (err) => log(`Unhandled Rejection: ${err.message}`, 'red', true));
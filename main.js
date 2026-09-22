/*************************************
* Raw Output Suppression Code
*************************************/

const originalWrite = process.stdout.write;
process.stdout.write = function (chunk, encoding, callback) {
    const message = chunk.toString();
    if (message.includes('Closing session: SessionEntry') || message.includes('SessionEntry {')) {
        return;
    }
    return originalWrite.apply(this, arguments);
};

const originalWriteError = process.stderr.write;
process.stderr.write = function (chunk, encoding, callback) {
    const message = chunk.toString();
    if (message.includes('Closing session: SessionEntry')) {
        return;
    }
    return originalWriteError.apply(this, arguments);
};

const originalLog = console.log;
console.log = function (message, ...optionalParams) {
    if (typeof message === 'string' && message.startsWith('Closing session: SessionEntry')) {
        return;
    }
    originalLog.apply(console, [message, ...optionalParams]);
};

/*━━━━━━━━━━━━━━━━━━━━*/
// -----Core imports first-----
/*━━━━━━━━━━━━━━━━━━━━*/
const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fs = require('fs');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { jidDecode } = require('@whiskeysockets/baileys');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const isAdmin = require('./lib/isAdmin');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { normalizeJid, compareJids } = require('./lib/jid');
const { createFakeContact } = require('./lib/fakeContact');
const moment = require('moment-timezone');
const timezones = settings.timezone || 'Africa/Nairobi';

const _cache = {
    groupMeta: new Map(),
    groupMetaTTL: 120000,
    modeData: null,
    modeDataTime: 0,
    modeDataTTL: 5000
};

function getCachedGroupMeta(sock, chatId) {
    const cached = _cache.groupMeta.get(chatId);
    if (cached && Date.now() - cached.time < _cache.groupMetaTTL) {
        return Promise.resolve(cached.data);
    }
    return sock.groupMetadata(chatId).then(data => {
        _cache.groupMeta.set(chatId, { data, time: Date.now() });
        if (_cache.groupMeta.size > 200) {
            const oldest = _cache.groupMeta.keys().next().value;
            _cache.groupMeta.delete(oldest);
        }
        return data;
    }).catch(() => ({}));
}

function getCachedModeData() {
    const now = Date.now();
    if (_cache.modeData && now - _cache.modeDataTime < _cache.modeDataTTL) {
        return _cache.modeData;
    }
    try {
        _cache.modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
        _cache.modeDataTime = now;
    } catch (e) {
        _cache.modeData = { isPublic: true, mode: 'public' };
        _cache.modeDataTime = now;
    }
    return _cache.modeData;
}

/*━━━━━━━━━━━━━━━━━━━━*/
// -----Command imports - Handlers-----
/*━━━━━━━━━━━━━━━━━━━━*/
const { autotypingCommand, isAutotypingEnabled, sendTyping, stopTyping } = require('./commands/autotyping');
const { autorecordingCommand, isAutorecordingEnabled, sendRecording, stopRecording } = require('./commands/autorecording');
const { autobothCommand, isAutobothEnabled, sendBothStart, sendBothBackground, stopBoth } = require('./commands/autoboth');
const { getPrefix, handleSetPrefixCommand } = require('./commands/setprefix');
const { getOwnerName, handleSetOwnerCommand } = require('./commands/setowner');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');
const { readReceiptsCommand } = require('./commands/autoReadReciepts');
const { alwaysonlineCommand, applyAlwaysOnlineOnStartup } = require('./commands/alwaysonline');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const { setGroupDescription, setGroupName, setGroupPhoto, getGroupProfile, getGroupName, getGroupDescription, setDisappearingMessages } = require('./commands/groupmanage');
const { handleAntibotCommand, handleAntibotJoin } = require('./commands/antibot');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const { addCommandReaction, addMessageReaction, handleAreactCommand } = require('./lib/reactions');
const { fancyCommand, replyHandlers: fancyReplyHandlers } = require('./commands/fancy');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { getcmdCommand } = require('./commands/getcmd');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { miscCommand, handleHeart } = require('./commands/misc');

/*━━━━━━━━━━━━━━━━━━━━*/
// -----Command imports-----
/*━━━━━━━━━━━━━━━━━━━━*/
const joinCommand = require('./commands/join');
const getppCommand = require('./commands/getpp');
const tagAllCommand = require('./commands/tagall');

// ── UPDATED: help now exports multiple functions ──────────────────────────────
const { helpCommand, handleNumberResponse } = require('./commands/help');
// ─────────────────────────────────────────────────────────────────────────────

const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const timeCommand = require('./commands/time');
const botInfoCommand = require('./commands/botinfo');
const setTimezoneCommand = require('./commands/settimezone');
const setOwnerNumberCommand = require('./commands/setownernumber');
const blurCommand = require('./commands/img-blur');
const githubCommand = require('./commands/github');
const antibadwordCommand = require('./commands/antibadword');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const { resetlinkCommand, linkCommand } = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewonceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const ytdocvideoCommand = require('./commands/ytdocvideo');
const ytdocplayCommand = require('./commands/ytdocplay');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const broadcastCommand    = require('./commands/broadcast');
const listgroupsCommand   = require('./commands/listgroups');
const closegroupCommand   = require('./commands/closegroup');
const opengroupCommand    = require('./commands/opengroup');
const getvcfCommand           = require('./commands/getvcf');
const { autosavestatusCommand, handleAutoSaveStatus } = require('./commands/autosavestatus');
const { stickercmdCommand, getStickerKey, loadStickerCmds } = require('./commands/stickercmd');
const setstickercmdCommand = require('./commands/setstickercmd');
const tagallremoteCommand = require('./commands/tagallremote');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');
const apkCommand = require('./commands/apk');
const menuConfigCommand = require('./commands/menuConfig');

// ── NEW: menuMode & setforwarded commands ─────────────────────────────────────
const menumodeCommand     = require('./commands/menumode');
const setforwardedCommand = require('./commands/setforwarded');
// ─────────────────────────────────────────────────────────────────────────────

const shazamCommand = require('./commands/shazam');
const saveStatusCommand = require('./commands/saveStatus');
const toAudioCommand = require('./commands/toAudio');
const gitcloneCommand = require('./commands/gitclone');
const leaveGroupCommand = require('./commands/leave');
const kickAllCommand = require('./commands/kickAll');
const ytsCommand = require('./commands/yts');
const setGroupStatusCommand = require('./commands/setGroupStatus');
const { handleDevReact } = require('./commands/devReact');
const imageCommand = require('./commands/image');
const gpt4Command = require('./commands/aiGpt4');
const vcfCommand = require('./commands/vcf');
const fetchCommand = require('./commands/fetch');
const { ytplayCommand, ytsongCommand } = require('./commands/ytdl');
const { chaneljidCommand } = require('./commands/chanel');
const { connectFourCommand, handleConnectFourMove } = require('./commands/connect4');
const pairCommand = require('./commands/pair');
const addCommand = require('./commands/add');
const tostatusCommand = require('./commands/tostatus');
const mediafireCommand = require('./commands/mf');
const deepseekCommand = require('./commands/deepseek');
const copilotCommand = require('./commands/ai-copilot');
const xvdlCommand = require('./commands/xvdl');
const visionCommand = require('./commands/vision');
const metaiCommand = require('./commands/ai-meta');
const { anticallCommand, handleIncomingCall } = require('./commands/anticall');
const dispCommand = require('./commands/disp');
const { livescoreCommand, betTipsCommand, footballNewsCommand, playerSearchCommand, teamSearchCommand, venueSearchCommand, gameEventsCommand, sportsHelpCommand, leagueCommand } = require('./commands/sports');
const { antistickerCommand, handleStickerDetection } = require('./commands/antisticker');
const { antistatusmentionCommand, handleAntiStatusMention } = require('./commands/antimention');
const { startScramble, handleScrambleGuess, endScramble } = require('./commands/scramble');
const { antiimageCommand, handleImageDetection } = require('./commands/antiimage');
const { blockCommand, unblockCommand, unblockallCommand, blocklistCommand } = require('./commands/blockUnblock');
const { ligue1StandingsCommand, laligaStandingsCommand, matchesCommand } = require('./commands/sport1');
const approveCommand = require('./commands/approve');
const smemeCommand = require('./commands/smeme');
const wormgptCommand = require('./commands/wormgpt');
const grokCommand = require('./commands/grok');
const blackboxCommand = require('./commands/ai-blackbox');
const birdCommand = require('./commands/ai-bird');
const speechwriterCommand = require('./commands/ai-speechwriter');
const mistralCommand = require('./commands/ai-mistral');
const ilamaCommand = require('./commands/ai-ilama');
const locationCommand = require('./commands/location');
const perplexityCommand = require('./commands/ai-perplexity');
const movieCommand = require('./commands/movie');
const transcribeCommand = require('./commands/transcribe');
const onlineCommand = require('./commands/online');
const lastseenCommand = require('./commands/lastseen');
const { antidemoteCommand, handleAntidemote } = require('./commands/antidemote');
const { antipromoteCommand, handleAntipromote } = require('./commands/antipromote');
const { setbotconfigCommand, setmenuimageCommand } = require('./commands/menuimage');
const { vv2Command, handleViewOnceReaction } = require('./commands/vv2');
const moviesCommand = require('./commands/movies');
const encryptCommand = require('./commands/encrypt');
const trimCommand = require('./commands/trim');
const teraboxCommand = require('./commands/terabox');
const magicstudioCommand = require('./commands/magicstudio');
const gpteditCommand = require('./commands/gptedit');
const pinterestCommand = require('./commands/pinterest');
const setBotNameCommand = require('./commands/setbotname');
const setBioCommand = require('./commands/setbio');
const { autofontCommand } = require('./commands/autofont');
const { applyFont } = require('./lib/autoFont');
const { createGroupCommand } = require('./commands/creategroup');

// ── menuSettings for menuMode intercepts ─────────────────────────────────────
const { getMenuSettings } = require('./commands/menuSettings');
const {
    addToPlaylistCommand,
    myPlaylistCommand,
    playlistPlayCommand,
    repeatCommand,
    shuffleCommand,
    playlistRemoveCommand,
    playlistClearCommand,
    playlistHelpCommand,
    setLastSong
} = require('./commands/playlist');
const getprefixCommand    = require('./commands/getprefix');
// ─────────────────────────────────────────────────────────────────────────────

// ── NEW: pending command ──────────────────────────────────────────────────────
const pendingCommand = require('./commands/pending');
// ─────────────────────────────────────────────────────────────────────────────

/*━━━━━━━━━━━━━━━━━━━━*/
// Global settings
/*━━━━━━━━━━━━━━━━━━━━*/
global.packname = settings?.packname || "ADEVOS X";
global.author = settings?.author || "𝐁𝐋𝐀𝐂𝐊𝐋𝐎𝐑𝐃-𝐗 ";
global.channelLink = "https://whatsapp.com/channel/0029Vb6wIVU9Bb5w69FQvt0W";
global.ytchanel = "";

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: false,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363408344756821@newsletter',
            newsletterName: '𝐒𝐏𝐎𝐈𝐋𝐄𝐑-𝐓𝐄𝐂𝐇 ',
            serverMessageId: -1
        }
    }
};

/*━━━━━━━━━━━━━━━━━━━━*/
// Main Message Handler
/*━━━━━━━━━━━━━━━━━━━━*/
async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

     await Promise.allSettled([
    handleAutoread(sock, message),
    handleDevReact(sock, message),
    handleAntiStatusMention(sock, message),
    addMessageReaction(sock, message),
    handleViewOnceReaction(sock, message)  // ← ongeza hapa
]);

        if (!sock._callListenerBound) {
            sock.ev.on('call', async (callData) => {
                await handleIncomingCall(sock, callData);
            });
            sock._callListenerBound = true;
        }

        if (!sock._fontPatched) {
            const _origSend = sock.sendMessage.bind(sock);
            sock.sendMessage = async (jid, content, options) => {
                if (content && typeof content.text === 'string') content = { ...content, text: applyFont(content.text) };
                if (content && typeof content.caption === 'string') content = { ...content, caption: applyFont(content.caption) };
                return _origSend(jid, content, options);
            };
            sock._fontPatched = true;
        }

        if (message.message) storeMessage(sock, message);

        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId   = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;

        /*━━━━━━━━━━━━━━━━━━━━*/
        // Dynamic prefix
        /*━━━━━━━━━━━━━━━━━━━━*/
        const prefix     = getPrefix();
        const isGroup    = chatId.endsWith('@g.us');
        const senderIsSudo = message.key.fromMe || await isOwnerOrSudo(senderId);

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        const fake = createFakeContact(message);

        // "> prefix" trigger
        if (userMessage === '> prefix') {
            await sock.sendMessage(chatId, { text: prefix || '(none — prefixless mode)' }, { quoted: fake });
            return;
        }

        // ── getprefix — works with OR without prefix ──────────────────────────
        if (
            userMessage === 'getprefix' ||
            userMessage === `${prefix}getprefix` ||
            userMessage === 'get prefix' ||
            userMessage === `${prefix}get prefix`
        ) {
            await getprefixCommand(sock, chatId, message);
            return;
        }
        // ─────────────────────────────────────────────────────────────────────

        /*━━━━━━━━━━━━━━━━━━━━*/
        // Console log
        /*━━━━━━━━━━━━━━━━━━━━*/
        if (userMessage) {
            if (!sock.decodeJid) sock.decodeJid = (jid) => normalizeJid(jid);

            const groupMetadata = isGroup ? await getCachedGroupMeta(sock, chatId) : {};
            const pushname  = message.pushName || "Unknown User";
            const groupName = isGroup ? (groupMetadata?.subject || 'Unknown Group') : undefined;
            const body = message.message.conversation ||
                        message.message.extendedTextMessage?.text ||
                        message.message.imageMessage?.caption ||
                        message.message.videoMessage?.caption || '';
            const mtype = message.message ? Object.keys(message.message)[0] : 'N/A';
            const dayz  = moment(Date.now()).tz(timezones).locale('en').format('dddd');
            const timez = moment(Date.now()).tz(timezones).locale('en').format('HH:mm:ss z');
            const datez = moment(Date.now()).tz(timezones).format("DD/MM/YYYY");

            // ── ANSI color codes ──────────────────────────────────────────────
            const RESET  = '\x1b[0m';
            const GRAY   = '\x1b[90m';
            const GREEN  = '\x1b[32m';
            const PURPLE = '\x1b[35m';

            if (message.message) {
                // Clean values — strip newlines to keep single-line format
                const cleanBody    = (body    || 'N/A').replace(/\n/g, ' ').replace(/\r/g, '').slice(0, 120);
                const cleanSender  = (pushname || 'N/A').replace(/\n/g, ' ').slice(0, 50);
                const cleanGroup   = (groupName || 'N/A').replace(/\n/g, ' ').slice(0, 60);
                const cleanChatId  = (chatId?.split('@')[0] || 'N/A');

                // Header — gray
                process.stdout.write(GRAY + '╭━━━━━━━━━━━━━ Adevos-X Bot ━━━━━━━━━━━━━━◆' + RESET + '\n');

                // Label (purple) : Value (green)
                process.stdout.write(PURPLE + '◇ Sent Time: ' + RESET + GREEN + `${dayz}, ${timez}` + RESET + '\n');
                process.stdout.write(PURPLE + '◇ Date:      ' + RESET + GREEN + `${datez}` + RESET + '\n');
                process.stdout.write(PURPLE + '◇ Msg Type:  ' + RESET + GREEN + `${mtype}` + RESET + '\n');
                process.stdout.write(PURPLE + '◇ Sender:    ' + RESET + GREEN + cleanSender + RESET + '\n');
                process.stdout.write(PURPLE + '◇ Chat ID:   ' + RESET + GREEN + cleanChatId + RESET + '\n');

                if (isGroup) {
                    process.stdout.write(PURPLE + '◇ Group:     ' + RESET + GREEN + cleanGroup + RESET + '\n');
                    process.stdout.write(PURPLE + '◇ Group JID: ' + RESET + GREEN + cleanChatId + RESET + '\n');
                }

                process.stdout.write(PURPLE + '◇ Message:   ' + RESET + GREEN + cleanBody + RESET + '\n');

                // Footer — gray
                process.stdout.write(GRAY + '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◆ ⳹' + RESET + '\n\n');
            }
        }

        // Mode check
        try {
            const data = getCachedModeData();
            if (data.mode === 'group'   && !isGroup) return;
            if (data.mode === 'pm'      && isGroup)  return;
            if (data.mode === 'private' && !message.key.fromMe && !senderIsSudo) return;
        } catch (error) { console.error('Error checking access mode:', error); }

        // Ban check
        if (isBanned(senderId) && !userMessage.startsWith(`${prefix}unban`)) {
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, { text: '❌ You are banned from using the bot. Contact an admin to get unbanned.', ...channelInfo });
            }
            return;
        }

        // Fancy reply handler
        const fancyStanzaId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (fancyStanzaId && fancyReplyHandlers.has(fancyStanzaId)) {
            await fancyReplyHandlers.get(fancyStanzaId)(message);
            return;
        }

        // Games
        if (/^[1-9]$/.test(userMessage)) {
            const tttResult = await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            if (!tttResult && parseInt(userMessage) <= 7) await handleConnectFourMove(sock, chatId, senderId, userMessage);
        }
        if (userMessage && !userMessage.startsWith(prefix)) await handleScrambleGuess(sock, chatId, senderId, userMessage);

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);
        if (isGroup && userMessage) await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
        if (isGroup && !message.key.fromMe) await handleLinkDetection(sock, chatId, message, userMessage, senderId);

        // PM blocker
        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (_) {}
                    return;
                }
            } catch (_) {}
        }

        /*━━━━━━━━━━━━━━━━━━━━*/
        // ── NEW: menuMode intercepts (BEFORE prefix check) ──────────────────
        /*━━━━━━━━━━━━━━━━━━━━*/

        // Buttons mode removed — using numbers mode instead

        // Numbers mode — single-number reply
        if (userMessage && !userMessage.startsWith(prefix)) {
            try {
                const ms = getMenuSettings();
                if (ms.menuMode === 'numbers') {
                    const numMatch = userMessage.match(/^([1-9][0-9]?)$/);
                    if (numMatch) {
                        await handleNumberResponse(sock, chatId, message, numMatch[1]);
                        return;
                    }
                }
            } catch (_) {}
        }

        // ── Sticker command alias intercept ────────────────────────────────
        const incomingSticker = message.message?.stickerMessage;
        if (incomingSticker) {
            try {
                const stickerData = loadStickerCmds();
                const sKey = getStickerKey(message);
                if (sKey && stickerData[sKey]) {
                    const mappedCmd = stickerData[sKey].command;
                    // Simulate the command as if user typed it
                    const simulatedMessage = { ...message };
                    simulatedMessage.message = {
                        conversation: `${prefix}${mappedCmd}`
                    };
                    // Re-emit as a text message to be handled normally
                    const fakeUpdate = { messages: [simulatedMessage], type: 'notify' };
                    await handleMessages(sock, fakeUpdate, null);
                    return;
                }
            } catch (_) {}
        }
        // ────────────────────────────────────────────────────────────────────

        /*━━━━━━━━━━━━━━━━━━━━*/
        // Check for command prefix
        /*━━━━━━━━━━━━━━━━━━━━*/
        if (!userMessage.startsWith(prefix)) {
            if (isAutobothEnabled()) {
                sendBothStart(sock, chatId);
                sendBothBackground(sock, chatId, 10000);
            } else if (isAutotypingEnabled()) {
                sendTyping(sock, chatId);
            } else if (isAutorecordingEnabled()) {
                sendRecording(sock, chatId);
            }
            if (isGroup) {
                await Promise.allSettled([
                    handleChatbotResponse(sock, chatId, message, userMessage, senderId),
                    handleTagDetection(sock, chatId, message, senderId),
                    handleMentionDetection(sock, chatId, message),
                    handleStickerDetection(sock, chatId, message, senderId),
                    handleImageDetection(sock, chatId, message, senderId)
                ]);
            }
            return;
        }

        // Admin commands list
        const adminCommands = [
            `${prefix}mute`, `${prefix}unmute`, `${prefix}ban`, `${prefix}unban`,
            `${prefix}promote`, `${prefix}demote`, `${prefix}kick`,
            `${prefix}tagall`, `${prefix}tagnotadmin`, `${prefix}hidetag`,
            `${prefix}antilink`, `${prefix}antitag`, `${prefix}setgdesc`,
            `${prefix}setgname`, `${prefix}setgpp`, `${prefix}antibot`, `${prefix}setdispmessage`
        ];
        const isAdminCommand = adminCommands.some(cmd => userMessage === cmd || userMessage.startsWith(cmd + ' '));

        // Owner commands list
        const ownerCommands = [
            `${prefix}mode`, `${prefix}autostatus`, `${prefix}antidelete`,
            `${prefix}cleartmp`, `${prefix}setpp`, `${prefix}clearsession`,
            `${prefix}areact`, `${prefix}autoreact`, `${prefix}autotyping`,
            `${prefix}autorecording`, `${prefix}autorecord`, `${prefix}autoboth`,
            `${prefix}autoread`, `${prefix}pmblocker`, `${prefix}readreciepts`,
            `${prefix}alwaysonline`, `${prefix}getcmd`,
            // ── NEW ──
            `${prefix}menumode`, `${prefix}setforwarded`,
            `${prefix}broadcast`, `${prefix}bc`,
            `${prefix}listgroups`, `${prefix}groups`,
            `${prefix}close`, `${prefix}open`, `${prefix}tagallremote`,
            `${prefix}getvcf`,
            `${prefix}autosavestatus`, `${prefix}autosave`,
            `${prefix}stickercmd`, `${prefix}setstickercmd`
        ];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage === cmd || userMessage.startsWith(cmd + ' '));

        let isSenderAdmin = false;
        let isBotAdmin    = false;

        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId, message);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin    = adminStatus.isBotAdmin;
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo }, { quoted: fake });
                return;
            }
            if (
                userMessage.startsWith(`${prefix}mute`) || userMessage === `${prefix}unmute` ||
                userMessage.startsWith(`${prefix}ban`)  || userMessage.startsWith(`${prefix}unban`) ||
                userMessage.startsWith(`${prefix}promote`) || userMessage.startsWith(`${prefix}demote`)
            ) {
                if (!isSenderAdmin && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    return;
                }
            }
        }

        if (isOwnerCommand && !message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
            return;
        }

        if (isAutobothEnabled()) {
            sendBothStart(sock, chatId).catch(() => {});
            sendBothBackground(sock, chatId, 6000);
        } else if (isAutotypingEnabled()) {
            sendTyping(sock, chatId).catch(() => {});
        } else if (isAutorecordingEnabled()) {
            sendRecording(sock, chatId).catch(() => {});
        }

        let commandExecuted = false;

        switch (true) {
            /*━━━━━━━━━━━━━━━━━━━━*/
            // Prefix / Owner setup
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage.startsWith(`${prefix}setprefix`):
                await handleSetPrefixCommand(sock, chatId, senderId, message, userMessage, prefix);
                break;

            case userMessage.startsWith(`${prefix}setownernumber`) ||
                 userMessage.startsWith(`${prefix}setownernum`) ||
                 userMessage.startsWith(`${prefix}ownernumber`):
                await setOwnerNumberCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;

            case userMessage.startsWith(`${prefix}setowner`):
                await handleSetOwnerCommand(sock, chatId, senderId, message, userMessage, prefix);
                break;

            case userMessage === `${prefix}simage`:
            case userMessage === `${prefix}toimage`: {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the toimage command to convert it.', ...channelInfo }, { quoted: fake });
                }
                commandExecuted = true;
                break;
            }

            case userMessage.startsWith(`${prefix}kick`):
                await kickCommand(sock, chatId, senderId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                break;

            case userMessage.startsWith(`${prefix}mute`): {
                const parts      = userMessage.trim().split(/\s+/);
                const muteArg    = parts[1];
                const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes or use .mute with no number to mute immediately.' }, { quoted: message });
                } else {
                    await muteCommand(sock, chatId, senderId, message, muteDuration);
                }
                break;
            }

            case userMessage === `${prefix}shazam` || userMessage === `${prefix}whatsong` || userMessage === `${prefix}find`:
                await shazamCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}unmute`:
                await unmuteCommand(sock, chatId, senderId);
                break;

            case userMessage.startsWith(`${prefix}ban`):
                await banCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}gptedit`):
                await gpteditCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}ai` || userMessage.startsWith(`${prefix}ai `):
                await gpt4Command(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}pinterest`):
                await pinterestCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}wormgpt`):
                await wormgptCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}magicstudio`):
                await magicstudioCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}grok`):
                await grokCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}deepseek`):
                await deepseekCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}copilot`):
                await copilotCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}enc`):
                await encryptCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}terabox`):
                await teraboxCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}unban`):
                await unbanCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}help` || userMessage === `${prefix}menu` || userMessage === `${prefix}list`:
                await helpCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            case userMessage.startsWith(`${prefix}menuconfig`) ||
                 userMessage.startsWith(`${prefix}menuset`) ||
                 userMessage.startsWith(`${prefix}setmenu`):
                await menuConfigCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                commandExecuted = true;
                break;

            // ── NEW: menumode ─────────────────────────────────────────────────
            case userMessage === `${prefix}menumode` || userMessage.startsWith(`${prefix}menumode `):
                await menumodeCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                commandExecuted = true;
                break;

            // ── NEW: setforwarded ─────────────────────────────────────────────
            case userMessage === `${prefix}setforwarded` || userMessage.startsWith(`${prefix}setforwarded `):
                await setforwardedCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                commandExecuted = true;
                break;

            // ── NEW: broadcast ────────────────────────────────────────────────
            case userMessage === `${prefix}broadcast` ||
                 userMessage === `${prefix}bc` ||
                 userMessage.startsWith(`${prefix}broadcast `) ||
                 userMessage.startsWith(`${prefix}bc `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const bcArgs = userMessage.split(' ').slice(1);
                    await broadcastCommand(sock, chatId, message, bcArgs);
                }
                commandExecuted = true;
                break;
            // ─────────────────────────────────────────────────────────────────

            // ── NEW: listgroups ───────────────────────────────────────────────
            case userMessage === `${prefix}listgroups` ||
                 userMessage === `${prefix}groups`:
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    await listgroupsCommand(sock, chatId, message);
                }
                commandExecuted = true;
                break;

            // ── NEW: getvcf ───────────────────────────────────────────────────
            case userMessage === `${prefix}getvcf` ||
                 userMessage.startsWith(`${prefix}getvcf `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const vcfArgs = userMessage.split(' ').slice(1);
                    await getvcfCommand(sock, chatId, message, vcfArgs);
                }
                commandExecuted = true;
                break;

            // ── NEW: opengroup ────────────────────────────────────────────────
            case userMessage === `${prefix}open` ||
                 userMessage.startsWith(`${prefix}open `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const openArgs = userMessage.split(' ').slice(1);
                    await opengroupCommand(sock, chatId, message, openArgs);
                }
                commandExecuted = true;
                break;

            // ── NEW: closegroup ───────────────────────────────────────────────
            case userMessage === `${prefix}close` ||
                 userMessage.startsWith(`${prefix}close `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const closeArgs = userMessage.split(' ').slice(1);
                    await closegroupCommand(sock, chatId, message, closeArgs);
                }
                commandExecuted = true;
                break;

            // ── NEW: tagallremote ─────────────────────────────────────────────
            case userMessage === `${prefix}tagallremote` ||
                 userMessage.startsWith(`${prefix}tagallremote `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const tarArgs = userMessage.split(' ').slice(1);
                    await tagallremoteCommand(sock, chatId, message, tarArgs);
                }
                commandExecuted = true;
                break;
            // ─────────────────────────────────────────────────────────────────

            case userMessage === `${prefix}sticker` || userMessage === `${prefix}s`:
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            case userMessage.startsWith(`${prefix}warnings`):
    await warningsCommand(
        sock, 
        chatId, 
        message.message.extendedTextMessage?.contextInfo?.mentionedJid || [],
        message  // ← ongeza hii
    );
    break;

            case userMessage.startsWith(`${prefix}warn`):
                await warnCommand(sock, chatId, senderId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                break;

            case userMessage.startsWith(`${prefix}tts`) || userMessage.startsWith(`${prefix}say`):
                await ttsCommand(sock, chatId, userMessage.slice((prefix + 'tts').length).trim(), message);
                break;

            case userMessage.startsWith(`${prefix}fancy`):
                await fancyCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}delete`) || userMessage.startsWith(`${prefix}del`):
                await deleteCommand(sock, chatId, message, senderId);
                break;

            case userMessage.startsWith(`${prefix}vcf`) || userMessage.startsWith(`${prefix}vcard`):
                await vcfCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}retrive`) || userMessage.startsWith(`${prefix}viewonce`):
                await viewonceCommand(sock, chatId, message);
                break;

            case (userMessage === `${prefix}in` || userMessage.startsWith(`${prefix}in `)) || userMessage.startsWith(`${prefix}join`):
                await joinCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}attp`):
                await attpCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}apk`):
                await apkCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}menuimage`):
                await setmenuimageCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}configimage`):
                await setbotconfigCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}antidemote`):
                await antidemoteCommand(sock, chatId, message, senderId);
                break;

            case userMessage.startsWith(`${prefix}antipromote`):
                await antipromoteCommand(sock, chatId, message, senderId);
                break;

            case userMessage === `${prefix}settings` || userMessage === `${prefix}getsettings`:
                await settingsCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}mode`): {
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!' }, { quoted: fake });
                    return;
                }
                let data;
                try { data = JSON.parse(fs.readFileSync('./data/messageCount.json')); }
                catch (e) { await sock.sendMessage(chatId, { text: 'Failed to read bot mode status' }, { quoted: fake }); return; }

                const action = userMessage.split(' ')[1]?.toLowerCase();
                const validModes = ['private', 'public', 'group', 'pm'];
                const modeDescriptions = {
                    private: 'Private mode - Only the owner can use the bot',
                    public:  'Public mode - Everyone can use the bot',
                    group:   'Group mode - Only groups can use the bot (inbox messages ignored)',
                    pm:      'PM mode - Only private messages (inbox) can use the bot (groups ignored)'
                };
                if (!action) {
                    const cur = data.mode || (data.isPublic ? 'public' : 'private');
                    await sock.sendMessage(chatId, {
                        text: `*Mode Configuration*\n\nCurrent mode: *${cur}*\n\n*Available Mode:*\n ${prefix}mode private\n ${prefix}mode public\n ${prefix}mode group\n ${prefix}mode pm\n\nExample:\n${prefix}mode public`
                    }, { quoted: fake });
                    return;
                }
                if (!validModes.includes(action)) {
                    await sock.sendMessage(chatId, {
                        text: `Invalid mode!\n\nValid: ${validModes.join(', ')}\nExample: ${prefix}mode group`
                    }, { quoted: fake });
                    return;
                }
                data.mode = action; data.isPublic = (action === 'public');
                fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
                await sock.sendMessage(chatId, { text: `*Mode updated!*\n\n${modeDescriptions[action]}` }, { quoted: fake });
                break;
            }

            case userMessage.startsWith(`${prefix}pmblocker`):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use pmblocker.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                await pmblockerCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                commandExecuted = true;
                break;

            case userMessage === `${prefix}owner`:
                await ownerCommand(sock, chatId);
                break;

            case userMessage === `${prefix}tagall`:
                // exact .tagall inside current group
                if (isSenderAdmin || message.key.fromMe || senderIsSudo) {
                    await tagAllCommand(sock, chatId, senderId, message);
                } else {
                    await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use the tagall command.', ...channelInfo }, { quoted: fake });
                }
                break;

            // tagall with group JID arg — route to tagallremote
            case userMessage.startsWith(`${prefix}tagall `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const tArgs = userMessage.split(' ').slice(1);
                    await tagallremoteCommand(sock, chatId, message, tArgs);
                }
                commandExecuted = true;
                break;

            case userMessage === `${prefix}tagnotadmin`:
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;

            case userMessage.startsWith(`${prefix}hidetag`): {
                const messageText = rawText.slice((prefix + 'hidetag').length).trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            }

            case userMessage.startsWith(`${prefix}tag`): {
                const messageText  = rawText.slice((prefix + 'tag').length).trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            }

            case userMessage.startsWith(`${prefix}antilink`):
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: fake }); return; }
                if (!isBotAdmin) { await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.', ...channelInfo }, { quoted: message }); return; }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;

            case userMessage.startsWith(`${prefix}antitag`):
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message }); return; }
                if (!isBotAdmin) { await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.', ...channelInfo }, { quoted: message }); return; }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;

            case userMessage === `${prefix}send` || userMessage === `${prefix}get` || userMessage === `${prefix}save`:
                await saveStatusCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}setgstatus`) || userMessage.startsWith(`${prefix}togroupstatus`) || userMessage.startsWith(`${prefix}tosgroup`):
                await setGroupStatusCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}meme`:  await memeCommand(sock, chatId, message); break;
            case userMessage === `${prefix}joke`:  await jokeCommand(sock, chatId, message); break;
            case userMessage === `${prefix}quote`: await quoteCommand(sock, chatId, message); break;
            case userMessage === `${prefix}fact`:  await factCommand(sock, chatId, message, message); break;

            case userMessage.startsWith(`${prefix}weather`): {
                const city = userMessage.slice((prefix + 'weather').length).trim();
                if (city) { await weatherCommand(sock, chatId, message, city); }
                else { await sock.sendMessage(chatId, { text: `Please specify a city, e.g., ${prefix}weather London`, ...channelInfo }, { quoted: message }); }
                break;
            }

            case userMessage === `${prefix}news`:
                await newsCommand(sock, chatId);
                break;

            case userMessage.startsWith(`${prefix}ttt`) || userMessage.startsWith(`${prefix}tictactoe`):
                await tictactoeCommand(sock, chatId, senderId, userMessage.split(' ').slice(1).join(' '));
                break;

            case userMessage.startsWith(`${prefix}move`): {
                const pos = parseInt(userMessage.split(' ')[1]);
                if (isNaN(pos)) { await sock.sendMessage(chatId, { text: 'Please provide a valid position number.', ...channelInfo }); }
                else { await handleTicTacToeMove(sock, chatId, senderId, pos); }
                break;
            }

            case userMessage.startsWith(`${prefix}connect4`) || userMessage.startsWith(`${prefix}cf`):
                await connectFourCommand(sock, chatId, senderId, userMessage.split(' ').slice(1).join(' '));
                break;

            case userMessage.startsWith(`${prefix}drop`): {
                const col = parseInt(userMessage.split(' ')[1]);
                if (isNaN(col)) { await sock.sendMessage(chatId, { text: 'Please provide a valid column number (1-7).', ...channelInfo }); }
                else {
                    const handled = await handleConnectFourMove(sock, chatId, senderId, col.toString());
                    if (!handled) await sock.sendMessage(chatId, { text: 'You are not in an active Connect Four game. Start one with `.connectfour`', ...channelInfo });
                }
                break;
            }

            case userMessage === `${prefix}forfeit` || userMessage === `${prefix}surrender`: {
                const cfH  = await handleConnectFourMove(sock, chatId, senderId, 'forfeit');
                const tttH = await handleTicTacToeMove(sock, chatId, senderId, 'forfeit');
                if (!cfH && !tttH) await sock.sendMessage(chatId, { text: 'You are not in any active game.', ...channelInfo });
                break;
            }

            case userMessage === `${prefix}topmembers`: topMembers(sock, chatId, isGroup); break;

            case userMessage.startsWith(`${prefix}hangman`): startHangman(sock, chatId); break;

            case userMessage.startsWith(`${prefix}guess`): {
                const g = userMessage.split(' ')[1];
                if (g) { guessLetter(sock, chatId, g); }
                else { sock.sendMessage(chatId, { text: `Please guess a letter using ${prefix}guess <letter>`, ...channelInfo }, { quoted: message }); }
                break;
            }

            case userMessage.startsWith(`${prefix}trivia`): startTrivia(sock, chatId); break;

            case userMessage.startsWith(`${prefix}answer`): {
                const ans = userMessage.split(' ').slice(1).join(' ');
                if (ans) { answerTrivia(sock, chatId, ans); }
                else { sock.sendMessage(chatId, { text: `Please provide an answer using ${prefix}answer <answer>`, ...channelInfo }, { quoted: message }); }
                break;
            }

            case userMessage.startsWith(`${prefix}compliment`): await complimentCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}insult`):     await insultCommand(sock, chatId, message);     break;

            case userMessage.startsWith(`${prefix}scramble`):
                await startScramble(sock, chatId, senderId, userMessage.split(' ')[1] || '');
                break;

            case userMessage.startsWith(`${prefix}endscramble`): await endScramble(sock, chatId); break;
            case userMessage.startsWith(`${prefix}vv2`):         await vv2Command(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}8ball`):
                await eightBallCommand(sock, chatId, userMessage.split(' ').slice(1).join(' '));
                break;

            case userMessage.startsWith(`${prefix}lyrics`):
                await lyricsCommand(sock, chatId, userMessage.split(' ').slice(1).join(' '), message);
                break;

            case userMessage === `${prefix}simp` || userMessage.startsWith(`${prefix}simp `):
                await simpCommand(sock, chatId,
                    message.message?.extendedTextMessage?.contextInfo?.quotedMessage,
                    message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
                    senderId);
                break;

            case userMessage.startsWith(`${prefix}stupid`) || userMessage.startsWith(`${prefix}itssostupid`) || userMessage.startsWith(`${prefix}iss`):
                await stupidCommand(sock, chatId,
                    message.message?.extendedTextMessage?.contextInfo?.quotedMessage,
                    message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
                    senderId, userMessage.split(' ').slice(1));
                break;

            case userMessage === `${prefix}dare`:  await dareCommand(sock, chatId, message);  break;
            case userMessage === `${prefix}truth`: await truthCommand(sock, chatId, message); break;
            case userMessage === `${prefix}clear`: if (isGroup) await clearCommand(sock, chatId); break;

            case userMessage.startsWith(`${prefix}promote`):
                await promoteCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                break;

            case userMessage.startsWith(`${prefix}demote`):
                await demoteCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message);
                break;

            case userMessage === `${prefix}ping` || userMessage === `${prefix}p`: await pingCommand(sock, chatId, message); break;
            case userMessage === `${prefix}time` || userMessage === `${prefix}date` || userMessage === `${prefix}datetime`: await timeCommand(sock, chatId, message); break;
            case userMessage === `${prefix}botinfo` || userMessage === `${prefix}info` || userMessage === `${prefix}status`: await botInfoCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}settimezone`) || userMessage.startsWith(`${prefix}settz`) || userMessage.startsWith(`${prefix}timezone`):
                await setTimezoneCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '), message.key.fromMe || senderIsSudo);
                break;

            case userMessage === `${prefix}getpp`: await getppCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}block`):    await blockCommand(sock, chatId, message);    break;
            case userMessage.startsWith(`${prefix}unblock`):  await unblockCommand(sock, chatId, message);  break;
            case userMessage === `${prefix}unblockall`:        await unblockallCommand(sock, chatId, message); break;
            case userMessage === `${prefix}link`:              await linkCommand(sock, chatId, message);     break;

            case userMessage === `${prefix}allblocklist` || userMessage === `${prefix}listblock`:
                await blocklistCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}uptime` || userMessage === `${prefix}up` || userMessage === `${prefix}runtime`:
                await aliveCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}mention`):
                await mentionToggleCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '), message.key.fromMe || senderIsSudo);
                break;

            case userMessage === `${prefix}setmention`:
                await setMentionCommand(sock, chatId, message, message.key.fromMe || senderIsSudo);
                break;

            case userMessage.startsWith(`${prefix}blur`):
                await blurCommand(sock, chatId, message, message.message?.extendedTextMessage?.contextInfo?.quotedMessage);
                break;

            case userMessage.startsWith(`${prefix}welcome`):
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message }); break; }
                if (!isSenderAdmin) { const a = await isAdmin(sock, chatId, senderId); isSenderAdmin = a.isSenderAdmin; }
                if (isSenderAdmin || message.key.fromMe || senderIsSudo) { await welcomeCommand(sock, chatId, message); }
                else { await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message }); }
                break;

            case userMessage.startsWith(`${prefix}goodbye`):
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message }); break; }
                if (!isSenderAdmin) { const a = await isAdmin(sock, chatId, senderId); isSenderAdmin = a.isSenderAdmin; }
                if (isSenderAdmin || message.key.fromMe || senderIsSudo) { await goodbyeCommand(sock, chatId, message); }
                else { await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message }); }
                break;

            case userMessage === `${prefix}git` || userMessage === `${prefix}github` ||
                 userMessage === `${prefix}sc`  || userMessage === `${prefix}script`  ||
                 userMessage === `${prefix}repo`:
                await githubCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}antibadword`):
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message }); return; }
                {
                    const as = await isAdmin(sock, chatId, senderId);
                    if (!as.isBotAdmin) { await sock.sendMessage(chatId, { text: '*Bot must be admin to use this feature*', ...channelInfo }, { quoted: message }); return; }
                    await antibadwordCommand(sock, chatId, message, senderId, as.isSenderAdmin);
                }
                break;

            case userMessage.startsWith(`${prefix}chatbot`):
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message }); return; }
                {
                    const cas = await isAdmin(sock, chatId, senderId);
                    if (!cas.isSenderAdmin && !message.key.fromMe && !senderIsSudo) { await sock.sendMessage(chatId, { text: '*Only admins or bot owner can use this command*', ...channelInfo }, { quoted: message }); return; }
                    await handleChatbotCommand(sock, chatId, message, userMessage.slice((prefix + 'chatbot').length).trim());
                }
                break;

            case userMessage.startsWith(`${prefix}yts`) || userMessage.startsWith(`${prefix}ytsearch`):
                await ytsCommand(sock, chatId, senderId, message, userMessage); break;

            case userMessage.startsWith(`${prefix}fetch`) || userMessage.startsWith(`${prefix}inspect`):
                await fetchCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}setbotname`): await setBotNameCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}setbio`):     await setBioCommand(sock, chatId, message);     break;

            case userMessage.startsWith(`${prefix}league1standings`): await ligue1StandingsCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}laligastandings`):  await laligaStandingsCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}maches`):           await matchesCommand(sock, chatId, message);         break;

            case userMessage.startsWith(`${prefix}mf`) || userMessage.startsWith(`${prefix}mediafire`):
                await mediafireCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}pair`) || userMessage.startsWith(`${prefix}paircode`):
                await pairCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}xvideo`) || userMessage.startsWith(`${prefix}xvdl`):
                await xvdlCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}siries`) || userMessage.startsWith(`${prefix}stream`):
                await moviesCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}trim`) || userMessage.startsWith(`${prefix}trimed`):
                await trimCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}smeme`) || userMessage.startsWith(`${prefix}wmeme`):
                await smemeCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}ytvideo`) || userMessage.startsWith(`${prefix}ytv`):
                await ytplayCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}ytaudio`) || userMessage.startsWith(`${prefix}ytplay`):
                await ytsongCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}antisticker`) || userMessage.startsWith(`${prefix}nosticker`):
                await antistickerCommand(sock, chatId, message, senderId); break;

            case userMessage.startsWith(`${prefix}antiimage`) || userMessage.startsWith(`${prefix}noimage`):
                await antiimageCommand(sock, chatId, message, senderId); break;

            case userMessage.startsWith(`${prefix}anticall`) || userMessage.startsWith(`${prefix}nocall`):
                await anticallCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}disp`): await dispCommand(sock, chatId, message); break;

            case userMessage === `${prefix}livescore` || userMessage === `${prefix}ls`:
                await livescoreCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}bettips`) || userMessage.startsWith(`${prefix}bet`):
                await betTipsCommand(sock, chatId, message); break;

            case userMessage === `${prefix}fnews` || userMessage === `${prefix}footballnews`:
                await footballNewsCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}player`):    await playerSearchCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}team`):      await teamSearchCommand(sock, chatId, message);   break;
            case userMessage.startsWith(`${prefix}venue`):     await venueSearchCommand(sock, chatId, message);  break;
            case userMessage.startsWith(`${prefix}gameevents`):await gameEventsCommand(sock, chatId, message);   break;
            case userMessage === `${prefix}sports`:             await sportsHelpCommand(sock, chatId, message);   break;

            case userMessage.startsWith(`${prefix}epl`):        await leagueCommand(sock, chatId, message, 'epl');        break;
            case userMessage.startsWith(`${prefix}laliga`):     await leagueCommand(sock, chatId, message, 'laliga');     break;
            case userMessage.startsWith(`${prefix}ucl`):        await leagueCommand(sock, chatId, message, 'ucl');        break;
            case userMessage.startsWith(`${prefix}bundesliga`): await leagueCommand(sock, chatId, message, 'bundesliga'); break;
            case userMessage.startsWith(`${prefix}seriea`):     await leagueCommand(sock, chatId, message, 'seriea');     break;
            case userMessage.startsWith(`${prefix}euros`):      await leagueCommand(sock, chatId, message, 'euros');      break;
            case userMessage.startsWith(`${prefix}fifa`):       await leagueCommand(sock, chatId, message, 'fifa');       break;

            case userMessage.startsWith(`${prefix}antistatusmention`) || userMessage.startsWith(`${prefix}antistatus`) ||
                 userMessage.startsWith(`${prefix}antigroupmention`)  || userMessage.startsWith(`${prefix}antistatusgroup`) ||
                 userMessage.startsWith(`${prefix}antigcmention`):
                await antistatusmentionCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}take`):
                await takeCommand(sock, chatId, message, rawText.slice((prefix + 'take').length).trim().split(' '));
                break;

            case userMessage === `${prefix}flirt`: await flirtCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}rate`): await characterCommand(sock, chatId, message); break;

            // ── pending ───────────────────────────────────────────────────────
            case userMessage === `${prefix}pending` || userMessage.startsWith(`${prefix}pending `):
                await pendingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            // ─────────────────────────────────────────────────────────────────

            // ── PLAYLIST COMMANDS (must be before .add) ───────────────────────
            case userMessage === `${prefix}playlist`:
                await playlistHelpCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            case userMessage === `${prefix}addtoplaylist` ||
                 userMessage.startsWith(`${prefix}addtoplaylist `):
                {
                    const atpArgs = userMessage.split(' ').slice(1);
                    await addToPlaylistCommand(sock, chatId, message, atpArgs);
                }
                commandExecuted = true;
                break;

            case userMessage === `${prefix}myplaylist` ||
                 userMessage === `${prefix}pl`:
                await myPlaylistCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            case userMessage === `${prefix}playlistplay` ||
                 userMessage.startsWith(`${prefix}playlistplay `):
                {
                    const ppArgs = userMessage.split(' ').slice(1);
                    await playlistPlayCommand(sock, chatId, message, ppArgs);
                }
                commandExecuted = true;
                break;

            case userMessage === `${prefix}repeat` ||
                 userMessage.startsWith(`${prefix}repeat `):
                {
                    const repArgs = userMessage.split(' ').slice(1);
                    await repeatCommand(sock, chatId, message, repArgs);
                }
                commandExecuted = true;
                break;

            case userMessage === `${prefix}shuffle` ||
                 userMessage.startsWith(`${prefix}shuffle `):
                {
                    const shufArgs = userMessage.split(' ').slice(1);
                    await shuffleCommand(sock, chatId, message, shufArgs);
                }
                commandExecuted = true;
                break;

            case userMessage === `${prefix}playlistremove` ||
                 userMessage.startsWith(`${prefix}playlistremove `):
                {
                    const prArgs = userMessage.split(' ').slice(1);
                    await playlistRemoveCommand(sock, chatId, message, prArgs);
                }
                commandExecuted = true;
                break;

            case userMessage === `${prefix}playlistclear` ||
                 userMessage.startsWith(`${prefix}playlistclear `):
                {
                    const pcArgs = userMessage.split(' ').slice(1);
                    await playlistClearCommand(sock, chatId, message, pcArgs);
                }
                commandExecuted = true;
                break;
            // ─────────────────────────────────────────────────────────────────

            case userMessage.startsWith(`${prefix}add`):  await addCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}approve`): await approveCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}creategroup`):
                await createGroupCommand(sock, chatId, senderId, message, rawText); break;

            case userMessage.startsWith(`${prefix}wasted`): await wastedCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}analyse`) || userMessage.startsWith(`${prefix}vision`):
                await visionCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}meta`) || userMessage.startsWith(`${prefix}metai`):
                await metaiCommand(sock, chatId, message); break;

            case userMessage === `${prefix}ship`:
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message }); return; }
                await shipCommand(sock, chatId, message); break;

            case userMessage === `${prefix}groupinfo` || userMessage === `${prefix}infogroup` || userMessage === `${prefix}infogrupo`:
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message }); return; }
                await groupInfoCommand(sock, chatId, message); break;

            case userMessage === `${prefix}reset` || userMessage === `${prefix}revoke`:
                await resetlinkCommand(sock, chatId, message); break;

            case userMessage === `${prefix}admin` || userMessage === `${prefix}listadmin`:
                if (!isGroup) { await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message }); return; }
                await staffCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}tourl`) || userMessage.startsWith(`${prefix}url`):
                await urlCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}chanelid`) || userMessage.startsWith(`${prefix}chjid`):
                await chaneljidCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}image`) || userMessage.startsWith(`${prefix}img`):
                await imageCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}emojimix`) || userMessage.startsWith(`${prefix}emix`):
                await emojimixCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}tg`) || userMessage.startsWith(`${prefix}tgsticker`):
                await stickerTelegramCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}clone`) || userMessage.startsWith(`${prefix}gitclone`):
                await gitcloneCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}tostatus`) || userMessage.startsWith(`${prefix}setstatus`):
                await tostatusCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}ilama`) || userMessage.startsWith(`${prefix}illama`):
                await ilamaCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}blackai`) || userMessage.startsWith(`${prefix}blackbox`):
                await blackboxCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}mist`) || userMessage.startsWith(`${prefix}mistral`):
                await mistralCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}birdai`) || userMessage.startsWith(`${prefix}bird`):
                await birdCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}speech`) || userMessage.startsWith(`${prefix}speechwrite`):
                await speechwriterCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}locate`) || userMessage.startsWith(`${prefix}location`):
                await locationCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}perplexity`) || userMessage.startsWith(`${prefix}plexity`):
                await perplexityCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}transcribe`) || userMessage.startsWith(`${prefix}totext`):
                await transcribeCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}online`) || userMessage.startsWith(`${prefix}listonline`):
                await onlineCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}movie`) || userMessage.startsWith(`${prefix}mvie`):
                await movieCommand(sock, chatId, message); break;

            case userMessage === `${prefix}left` || userMessage === `${prefix}leave`:
                await leaveGroupCommand(sock, chatId, message); break;

            case userMessage === `${prefix}removeall` || userMessage === `${prefix}killall`:
                await kickAllCommand(sock, chatId, message, senderId); break;

            case userMessage === `${prefix}toaudio` || userMessage === `${prefix}tomp3`:
                await toAudioCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}ytdocvideo`) || userMessage.startsWith(`${prefix}docytvideo`):
                await ytdocvideoCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}ytdocplay`) || userMessage.startsWith(`${prefix}docytplay`):
                await ytdocplayCommand(sock, chatId, message); break;

            case userMessage === `${prefix}clearsession` || userMessage === `${prefix}clearsesi`:
                await clearSessionCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}autostatus`):
                await autoStatusCommand(sock, chatId, message, userMessage.split(' ').slice(1)); break;

            case userMessage.startsWith(`${prefix}getcmd`):
                await getcmdCommand(sock, chatId, message, userMessage.split(' ').slice(1)); break;

            case userMessage.startsWith(`${prefix}metallic`): await textmakerCommand(sock, chatId, message, userMessage, 'metallic'); break;
            case userMessage.startsWith(`${prefix}ice`):      await textmakerCommand(sock, chatId, message, userMessage, 'ice');      break;
            case userMessage.startsWith(`${prefix}snow`):     await textmakerCommand(sock, chatId, message, userMessage, 'snow');     break;
            case userMessage.startsWith(`${prefix}impressive`): await textmakerCommand(sock, chatId, message, userMessage, 'impressive'); break;
            case userMessage.startsWith(`${prefix}matrix`):   await textmakerCommand(sock, chatId, message, userMessage, 'matrix');  break;
            case userMessage.startsWith(`${prefix}light`):    await textmakerCommand(sock, chatId, message, userMessage, 'light');   break;
            case userMessage.startsWith(`${prefix}neon`):     await textmakerCommand(sock, chatId, message, userMessage, 'neon');    break;
            case userMessage.startsWith(`${prefix}devil`):    await textmakerCommand(sock, chatId, message, userMessage, 'devil');   break;
            case userMessage.startsWith(`${prefix}purple`):   await textmakerCommand(sock, chatId, message, userMessage, 'purple');  break;
            case userMessage.startsWith(`${prefix}thunder`):  await textmakerCommand(sock, chatId, message, userMessage, 'thunder'); break;
            case userMessage.startsWith(`${prefix}leaves`):   await textmakerCommand(sock, chatId, message, userMessage, 'leaves');  break;
            case userMessage.startsWith(`${prefix}1917`):     await textmakerCommand(sock, chatId, message, userMessage, '1917');    break;
            case userMessage.startsWith(`${prefix}arena`):    await textmakerCommand(sock, chatId, message, userMessage, 'arena');   break;
            case userMessage.startsWith(`${prefix}hacker`):   await textmakerCommand(sock, chatId, message, userMessage, 'hacker');  break;
            case userMessage.startsWith(`${prefix}sand`):     await textmakerCommand(sock, chatId, message, userMessage, 'sand');    break;
            case userMessage.startsWith(`${prefix}blackpink`):await textmakerCommand(sock, chatId, message, userMessage, 'blackpink'); break;
            case userMessage.startsWith(`${prefix}glitch`):   await textmakerCommand(sock, chatId, message, userMessage, 'glitch');  break;
            case userMessage.startsWith(`${prefix}fire`):     await textmakerCommand(sock, chatId, message, userMessage, 'fire');    break;

            case userMessage.startsWith(`${prefix}antidelete`):
                await handleAntideleteCommand(sock, chatId, message, userMessage.slice((prefix + 'antidelete').length).trim());
                break;

            case userMessage === `${prefix}cleartemp`: await clearTmpCommand(sock, chatId, message); break;
            case userMessage === `${prefix}setpp`:     await setProfilePicture(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}setgroupdesc`):
                await setGroupDescription(sock, chatId, senderId, rawText.slice((prefix + 'setgrouodesc').length).trim(), message);
                break;

            case userMessage.startsWith(`${prefix}setgroupname`):
                await setGroupName(sock, chatId, senderId, rawText.slice((prefix + 'setgroupname').length).trim(), message);
                break;

            case userMessage.startsWith(`${prefix}setgrouppp`):
                await setGroupPhoto(sock, chatId, senderId, message); break;

            case userMessage === `${prefix}getgcprofile` || userMessage.startsWith(`${prefix}getgcprofile `):
                if (!isGroup) { await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: message }); return; }
                await getGroupProfile(sock, chatId, message); break;

            case userMessage === `${prefix}getgcname` || userMessage.startsWith(`${prefix}getgcname `):
                if (!isGroup) { await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: message }); return; }
                await getGroupName(sock, chatId, message); break;

            case userMessage === `${prefix}getgcdescription` || userMessage === `${prefix}getgcdesc` ||
                 userMessage.startsWith(`${prefix}getgcdescription `) || userMessage.startsWith(`${prefix}getgcdesc `):
                if (!isGroup) { await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: message }); return; }
                await getGroupDescription(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}setdispmessage`):
                await setDisappearingMessages(sock, chatId, senderId, rawText.slice((prefix + 'setdispmessage').length).trim(), message);
                break;

            case userMessage.startsWith(`${prefix}antibot`):
                if (!isGroup) { await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: message }); return; }
                await handleAntibotCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message); break;

            case userMessage.startsWith(`${prefix}instagram`) || userMessage.startsWith(`${prefix}insta`) ||
                 (userMessage === `${prefix}ig` || userMessage.startsWith(`${prefix}ig `)):
                await instagramCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}igs`): await igsCommand(sock, chatId, message, true); break;

            case userMessage.startsWith(`${prefix}fb`) || userMessage.startsWith(`${prefix}facebook`):
                await facebookCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}play`): {
                await playCommand(sock, chatId, message);
                // Record last played song for playlist
                const playSongQuery = userMessage.slice((prefix + 'play').length).trim();
                if (playSongQuery) {
                    const sId = message.key.participant || message.key.remoteJid;
                    setLastSong(sId.split('@')[0], { title: playSongQuery, query: playSongQuery });
                }
                break;
            }
            case userMessage.startsWith(`${prefix}spotify`): await spotifyCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}lastseen`):await lastseenCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}song`) || userMessage.startsWith(`${prefix}mp3`):
                await songCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}video`): await videoCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}tiktok`) || userMessage.startsWith(`${prefix}tt`):
                await tiktokCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}gpt`) || userMessage.startsWith(`${prefix}gemini`):
                await aiCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}translate`) || userMessage.startsWith(`${prefix}trt`): {
                const cLen = userMessage.startsWith(`${prefix}translate`) ? (prefix + 'translate').length : (prefix + 'trt').length;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(cLen));
                return;
            }

            case userMessage.startsWith(`${prefix}ss`) || userMessage.startsWith(`${prefix}ssweb`) || userMessage.startsWith(`${prefix}screenshot`): {
                const ssLen = userMessage.startsWith(`${prefix}screenshot`) ? (prefix + 'screenshot').length : userMessage.startsWith(`${prefix}ssweb`) ? (prefix + 'ssweb').length : (prefix + 'ss').length;
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssLen).trim());
                break;
            }

            case userMessage.startsWith(`${prefix}areact`) || userMessage.startsWith(`${prefix}autoreact`) || userMessage.startsWith(`${prefix}autoreaction`):
                await handleAreactCommand(sock, chatId, message, message.key.fromMe || senderIsSudo);
                break;

            case userMessage.startsWith(`${prefix}sudo`): await sudoCommand(sock, chatId, message); break;

            case userMessage === `${prefix}goodnight` || userMessage === `${prefix}lovenight` || userMessage === `${prefix}gn`:
                await goodnightCommand(sock, chatId, message); break;

            case userMessage === `${prefix}shayari` || userMessage === `${prefix}shayri`:
                await shayariCommand(sock, chatId, message); break;

            case userMessage === `${prefix}roseday`: await rosedayCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}imagine`) || userMessage.startsWith(`${prefix}flux`) || userMessage.startsWith(`${prefix}dalle`):
                await imagineCommand(sock, chatId, message); break;

            case userMessage === `${prefix}jid`: await groupJidCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}autotyping`):   await autotypingCommand(sock, chatId, message);   break;
            case userMessage.startsWith(`${prefix}autorecording`) || userMessage.startsWith(`${prefix}autorecord`):
                await autorecordingCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}autoboth`):     await autobothCommand(sock, chatId, message);     break;
            case userMessage.startsWith(`${prefix}autoread`):     await autoreadCommand(sock, chatId, message); commandExecuted = true; break;
            case userMessage.startsWith(`${prefix}readreciepts`): await readReceiptsCommand(sock, chatId, message); break;
            case userMessage.startsWith(`${prefix}alwaysonline`): await alwaysonlineCommand(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}autofont`) || userMessage.startsWith(`${prefix}setfont`):
                await autofontCommand(sock, chatId, message, message.key.fromMe || senderIsSudo); break;

            case userMessage.startsWith(`${prefix}heart`): await handleHeart(sock, chatId, message); break;

            case userMessage.startsWith(`${prefix}horny`):    { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['horny',    ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}circle`):   { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['circle',   ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}lgbt`):     { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['lgbtq',    ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}lolice`):   { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['lolice',   ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}simpcard`): { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['simpcard', ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}misc`):     { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['misc',     ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}its-so-stupid`): { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['its-so-stupid', ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}namecard`): { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['namecard', ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}tweet`):    { const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['tweet',    ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}ytcomment`):{ const p = userMessage.trim().split(/\s+/); await miscCommand(sock, chatId, message, ['youtube-comment', ...p.slice(1)]); break; }
            case userMessage.startsWith(`${prefix}oogway2`):
            case userMessage.startsWith(`${prefix}oogway`): {
                const p   = userMessage.trim().split(/\s+/);
                const sub = userMessage.startsWith(`${prefix}oogway2`) ? 'oogway2' : 'oogway';
                await miscCommand(sock, chatId, message, [sub, ...p.slice(1)]);
                break;
            }

            case userMessage.startsWith(`${prefix}comrade`):
            case userMessage.startsWith(`${prefix}gay`):
            case userMessage.startsWith(`${prefix}glass`):
            case userMessage.startsWith(`${prefix}jail`):
            case userMessage.startsWith(`${prefix}passed`):
            case userMessage.startsWith(`${prefix}triggered`): {
                const p   = userMessage.trim().split(/\s+/);
                const sub = userMessage.slice(prefix.length).split(/\s+/)[0];
                await miscCommand(sock, chatId, message, [sub, ...p.slice(1)]);
                break;
            }

            case userMessage.startsWith(`${prefix}animu`):
                await animeCommand(sock, chatId, message, userMessage.trim().split(/\s+/).slice(1)); break;

            case userMessage.startsWith(`${prefix}nome`):  case userMessage.startsWith(`${prefix}nom`):
            case userMessage.startsWith(`${prefix}poke`):  case userMessage.startsWith(`${prefix}cry`):
            case userMessage.startsWith(`${prefix}hug`):   case userMessage.startsWith(`${prefix}pat`):
            case userMessage.startsWith(`${prefix}kiss`):  case userMessage.startsWith(`${prefix}wink`):
            case userMessage.startsWith(`${prefix}facepalm`): case userMessage.startsWith(`${prefix}face-palm`):
            case userMessage.startsWith(`${prefix}loli`):  case userMessage.startsWith(`${prefix}waifu`):
            case userMessage.startsWith(`${prefix}neko`):  case userMessage.startsWith(`${prefix}kitsune`):
            case userMessage.startsWith(`${prefix}husbando`): case userMessage.startsWith(`${prefix}animequote`):
            case userMessage.startsWith(`${prefix}bite`):  case userMessage.startsWith(`${prefix}blush`):
            case userMessage.startsWith(`${prefix}cuddle`):case userMessage.startsWith(`${prefix}dance`):
            case userMessage.startsWith(`${prefix}slap`):  case userMessage.startsWith(`${prefix}pout`):
            case userMessage.startsWith(`${prefix}sleep`): case userMessage.startsWith(`${prefix}wave`):
            case userMessage.startsWith(`${prefix}smile`): {
                let sub = userMessage.trim().split(/\s+/)[0].slice(prefix.length);
                if (sub === 'facepalm' || sub === 'face-palm') sub = 'facepalm';
                if (sub === 'nome')       sub = 'nom';
                if (sub === 'loli')       sub = 'neko';
                if (sub === 'animequote') sub = 'quote';
                await animeCommand(sock, chatId, message, [sub]);
                break;
            }

            case userMessage === `${prefix}crop`:
                await stickercropCommand(sock, chatId, message); commandExecuted = true; break;

            case userMessage.startsWith(`${prefix}pies`):
                await piesCommand(sock, chatId, message, rawText.trim().split(/\s+/).slice(1));
                commandExecuted = true;
                break;

            case userMessage === '.china':     await piesAlias(sock, chatId, message, 'china');     commandExecuted = true; break;
            case userMessage === '.indonesia': await piesAlias(sock, chatId, message, 'indonesia'); commandExecuted = true; break;
            case userMessage === '.japan':     await piesAlias(sock, chatId, message, 'japan');     commandExecuted = true; break;
            case userMessage === '.korea':     await piesAlias(sock, chatId, message, 'korea');     commandExecuted = true; break;
            case userMessage === '.hijab':     await piesAlias(sock, chatId, message, 'hijab');     commandExecuted = true; break;

            case userMessage.startsWith(`${prefix}update`) || userMessage.startsWith(`${prefix}start`): {
                const parts  = rawText.trim().split(/\s+/);
                const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                await updateCommand(sock, chatId, message, zipArg);
                commandExecuted = true;
                break;
            }

            case userMessage.startsWith('.removebg') || userMessage.startsWith('.rmbg') || userMessage.startsWith(`${prefix}nobg`):
                await removebgCommand.exec(sock, message, userMessage.split(' ').slice(1)); break;

            case userMessage.startsWith(`${prefix}remini`) || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1)); break;

            case userMessage.startsWith(`${prefix}sora`):
                await soraCommand(sock, chatId, message); break;

            // ── NEW: stickercmd ───────────────────────────────────────────────
            case userMessage === `${prefix}stickercmd` ||
                 userMessage.startsWith(`${prefix}stickercmd `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const scArgs = userMessage.split(' ').slice(1);
                    await stickercmdCommand(sock, chatId, message, scArgs);
                }
                commandExecuted = true;
                break;

            // ── NEW: setstickercmd ────────────────────────────────────────────
            case userMessage === `${prefix}setstickercmd` ||
                 userMessage.startsWith(`${prefix}setstickercmd `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const sscArgs = userMessage.split(' ').slice(1);
                    await setstickercmdCommand(sock, chatId, message, sscArgs);
                }
                commandExecuted = true;
                break;
            // ─────────────────────────────────────────────────────────────────

            // ── NEW: autosavestatus ───────────────────────────────────────────────
            case userMessage === `${prefix}autosavestatus` ||
                 userMessage.startsWith(`${prefix}autosavestatus `) ||
                 userMessage === `${prefix}autosave` ||
                 userMessage.startsWith(`${prefix}autosave `):
                {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '❌ This command is only for the owner!' }, { quoted: fake });
                        break;
                    }
                    const assArgs = userMessage.split(' ').slice(1);
                    await autosavestatusCommand(sock, chatId, message, assArgs);
                }
                commandExecuted = true;
                break;
            // ─────────────────────────────────────────────────────────────────

            default:
                if (isGroup) {
                    const tasks = [
                        handleTagDetection(sock, chatId, message, senderId),
                        handleMentionDetection(sock, chatId, message),
                        handleStickerDetection(sock, chatId, message, senderId)
                    ];
                    if (userMessage) tasks.unshift(handleChatbotResponse(sock, chatId, message, userMessage, senderId));
                    await Promise.allSettled(tasks);
                }
                commandExecuted = false;
                break;
        }

        if (isGroup) {
            await Promise.allSettled([
                handleStickerDetection(sock, chatId, message, senderId),
                handleImageDetection(sock, chatId, message, senderId)
            ]);
        }

        if (isAutobothEnabled())     stopBoth(sock, chatId);
        else if (isAutotypingEnabled())   stopTyping(sock, chatId);
        else if (isAutorecordingEnabled())stopRecording(sock, chatId);

        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;
            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, { text: "❌ This command can only be used in a group." });
            }
            await sock.sendMessage(chatId, { text: `✅ Group JID: ${groupJid}` }, { quoted: message });
        }

    } catch (error) {
        console.error('❌ Error in message handler:', error.stack || error.message);
        if (chatId) {
            try { await sock.sendMessage(chatId, { text: `❌ Error: ${error.message || 'Unknown error'}`, ...channelInfo }); } catch (_) {}
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;
        if (!id.endsWith('@g.us')) return;

        let isPublic = true;
        try {
            const modeData = getCachedModeData();
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {}

        if (action === 'promote') {
            const blocked = await handleAntipromote(sock, id, participants, author);
            if (blocked) return;
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }
        if (action === 'demote') {
            const protected_ = await handleAntidemote(sock, id, participants, author);
            if (protected_) return;
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }
        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
            await handleAntibotJoin(sock, id, participants);
        }
        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
        await handleAutoSaveStatus(sock, status);
    },
    applyAlwaysOnlineOnStartup
};
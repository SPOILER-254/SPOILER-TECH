// commands/playlist.js
// Full playlist management system
// Commands: .addtoplaylist, .myplaylist, .playlistplay, .playlistremove, .playlistclear

const fs   = require('fs');
const path = require('path');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');

const DATA_FILE = path.join(__dirname, '../data/playlists.json');

// ── Data helpers ──────────────────────────────────────────────────────────────

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (_) { return {}; }
}

function saveData(data) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getUserId(senderId) {
    return senderId.split('@')[0];
}

function getPlaylist(data, userId) {
    if (!data[userId]) data[userId] = { songs: [] };
    return data[userId];
}

// ── Last played song tracker (in-memory) ─────────────────────────────────────
const lastSong = new Map(); // userId -> { title, query, duration, addedAt }

function setLastSong(userId, songInfo) {
    lastSong.set(userId, songInfo);
}

function getLastSong(userId) {
    return lastSong.get(userId) || null;
}

// ── .addtoplaylist ────────────────────────────────────────────────────────────

async function addToPlaylistCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const userId   = getUserId(senderId);
    const fake     = createFakeContact(message);
    const prefix   = getPrefix();

    const data     = loadData();
    const playlist = getPlaylist(data, userId);

    // Check if replying to a bot message (song was just downloaded)
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText = quotedMsg?.conversation ||
                       quotedMsg?.extendedTextMessage?.text ||
                       quotedMsg?.imageMessage?.caption ||
                       quotedMsg?.videoMessage?.caption || '';

    let songTitle = '';
    let songQuery = '';

    // Try to get song from args first (manual add)
    if (args && args.length > 0) {
        songTitle = args.join(' ').trim();
        songQuery = songTitle;
    }
    // Try to get from last downloaded song
    else {
        const last = getLastSong(userId);
        if (last) {
            songTitle = last.title;
            songQuery = last.query;
        } else {
            await sock.sendMessage(chatId, {
                text: `❌ No recent song found.\n\n*Options:*\n` +
                      `• Download a song with \`${prefix}play <song>\` then use \`${prefix}addtoplaylist\`\n` +
                      `• Or manually: \`${prefix}addtoplaylist <song name>\``
            }, { quoted: fake });
            return;
        }
    }

    // Check max songs per playlist
    const MAX_SONGS = 50;
    if (playlist.songs.length >= MAX_SONGS) {
        await sock.sendMessage(chatId, {
            text: `❌ Playlist is full! Maximum ${MAX_SONGS} songs.\n\nRemove some with \`${prefix}playlistremove <number>\``
        }, { quoted: fake });
        return;
    }

    // Check duplicate
    const exists = playlist.songs.find(s =>
        s.title.toLowerCase() === songTitle.toLowerCase()
    );
    if (exists) {
        await sock.sendMessage(chatId, {
            text: `ℹ️ *${songTitle}* is already in your playlist (song #${playlist.songs.indexOf(exists) + 1})`
        }, { quoted: fake });
        return;
    }

    // Add song
    const song = {
        id:       Date.now(),
        title:    songTitle,
        query:    songQuery,
        addedAt:  new Date().toLocaleString()
    };

    playlist.songs.push(song);
    saveData(data);

    await sock.sendMessage(chatId, {
        text: `✅ Added to playlist!\n\n` +
              `╭─[ *Playlist* ]\n` +
              `┃❏ *Song:* ${songTitle}\n` +
              `┃❏ *Position:* #${playlist.songs.length}\n` +
              `┃❏ *Total songs:* ${playlist.songs.length}\n` +
              `╰━────────━\n\n` +
              `_View playlist:_ \`${prefix}myplaylist\``
    }, { quoted: fake });
}

// ── .myplaylist ───────────────────────────────────────────────────────────────

async function myPlaylistCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const userId   = getUserId(senderId);
    const fake     = createFakeContact(message);
    const prefix   = getPrefix();
    const pushname = message.pushName || 'User';

    const data     = loadData();
    const playlist = getPlaylist(data, userId);

    if (playlist.songs.length === 0) {
        await sock.sendMessage(chatId, {
            text: `╭─[ *Your Playlist* ]\n` +
                  `┃❏ Playlist is empty!\n` +
                  `╰━────────━\n\n` +
                  `*Add songs:*\n` +
                  `• \`${prefix}play <song>\` then \`${prefix}addtoplaylist\`\n` +
                  `• \`${prefix}addtoplaylist <song name>\``
        }, { quoted: fake });
        return;
    }

    // Build playlist display
    let text = `╭─[ *${pushname}'s Playlist* ]\n`;
    text += `┃❏ *Total:* ${playlist.songs.length} song${playlist.songs.length !== 1 ? 's' : ''}\n`;
    text += `┃\n`;

    playlist.songs.forEach((song, i) => {
        text += `┃*${i + 1}.* ${song.title}\n`;
        text += `┃   _Added: ${song.addedAt}_\n`;
    });

    text += `╰━────────━\n\n`;
    text += `*Commands:*\n`;
    text += `• \`${prefix}playlistplay <number>\` — Play a song\n`;
    text += `• \`${prefix}playlistremove <number>\` — Remove a song\n`;
    text += `• \`${prefix}playlistclear\` — Clear all songs`;

    await sock.sendMessage(chatId, { text }, { quoted: fake });
}

// ── .playlistplay <number> ────────────────────────────────────────────────────

async function playlistPlayCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const userId   = getUserId(senderId);
    const fake     = createFakeContact(message);
    const prefix   = getPrefix();

    const data     = loadData();
    const playlist = getPlaylist(data, userId);

    if (playlist.songs.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ Your playlist is empty.\n\nAdd songs with \`${prefix}addtoplaylist\``
        }, { quoted: fake });
        return;
    }

    const num = parseInt(args[0]);
    if (!args[0] || isNaN(num) || num < 1 || num > playlist.songs.length) {
        await sock.sendMessage(chatId, {
            text: `❌ Invalid number. Choose between 1 and ${playlist.songs.length}.\n\n` +
                  `View playlist: \`${prefix}myplaylist\``
        }, { quoted: fake });
        return;
    }

    const song = playlist.songs[num - 1];

    await sock.sendMessage(chatId, {
        text: `🎵 Playing *${song.title}* from your playlist...`
    }, { quoted: fake });

    // Simulate the play command with the song query
    // We create a fake message with the play command
    const fakePlayMessage = {
        ...message,
        message: {
            conversation: `${prefix}play ${song.query}`
        }
    };

    // Require play command and execute
    try {
        const playCommand = require('./play');
        // Override userMessage to include the song query
        const originalConv = message.message.conversation;
        message.message.conversation = `${prefix}play ${song.query}`;
        await playCommand(sock, chatId, message);
        message.message.conversation = originalConv;
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to play: ${err.message}\n\nTry manually: \`${prefix}play ${song.query}\``
        }, { quoted: fake });
    }
}

// ── .playlistremove <number or name> ─────────────────────────────────────────

async function playlistRemoveCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const userId   = getUserId(senderId);
    const fake     = createFakeContact(message);
    const prefix   = getPrefix();

    const data     = loadData();
    const playlist = getPlaylist(data, userId);

    if (playlist.songs.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ Your playlist is already empty.`
        }, { quoted: fake });
        return;
    }

    if (!args || args.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ Please provide a song number or name.\n\n` +
                  `Usage:\n` +
                  `• \`${prefix}playlistremove 3\` — Remove by number\n` +
                  `• \`${prefix}playlistremove song name\` — Remove by name`
        }, { quoted: fake });
        return;
    }

    let songIndex = -1;
    const num = parseInt(args[0]);

    if (!isNaN(num) && args.length === 1) {
        // Remove by number
        if (num < 1 || num > playlist.songs.length) {
            await sock.sendMessage(chatId, {
                text: `❌ Invalid number. Choose between 1 and ${playlist.songs.length}.`
            }, { quoted: fake });
            return;
        }
        songIndex = num - 1;
    } else {
        // Remove by name
        const searchName = args.join(' ').toLowerCase();
        songIndex = playlist.songs.findIndex(s =>
            s.title.toLowerCase().includes(searchName)
        );
        if (songIndex === -1) {
            await sock.sendMessage(chatId, {
                text: `❌ Song not found: *${args.join(' ')}*\n\nView playlist: \`${prefix}myplaylist\``
            }, { quoted: fake });
            return;
        }
    }

    const removed = playlist.songs.splice(songIndex, 1)[0];
    saveData(data);

    await sock.sendMessage(chatId, {
        text: `✅ Removed *${removed.title}* from your playlist.\n` +
              `_${playlist.songs.length} song${playlist.songs.length !== 1 ? 's' : ''} remaining._`
    }, { quoted: fake });
}

// ── .playlistclear ────────────────────────────────────────────────────────────

async function playlistClearCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const userId   = getUserId(senderId);
    const fake     = createFakeContact(message);
    const prefix   = getPrefix();

    const data     = loadData();
    const playlist = getPlaylist(data, userId);

    if (playlist.songs.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ Your playlist is already empty.`
        }, { quoted: fake });
        return;
    }

    // Confirm step — if no 'confirm' arg, ask first
    if (!args || args[0]?.toLowerCase() !== 'confirm') {
        await sock.sendMessage(chatId, {
            text: `⚠️ This will delete all *${playlist.songs.length}* songs from your playlist!\n\n` +
                  `To confirm: \`${prefix}playlistclear confirm\``
        }, { quoted: fake });
        return;
    }

    const count = playlist.songs.length;
    playlist.songs = [];
    saveData(data);

    await sock.sendMessage(chatId, {
        text: `✅ Playlist cleared! Removed *${count}* song${count !== 1 ? 's' : ''}.`
    }, { quoted: fake });
}

// ── .playlist (help / overview) ───────────────────────────────────────────────

async function playlistHelpCommand(sock, chatId, message) {
    const fake   = createFakeContact(message);
    const prefix = getPrefix();

    await sock.sendMessage(chatId, {
        text: `╭─[ *Playlist System* ]\n` +
              `┃\n` +
              `┃ *Add songs:*\n` +
              `┃ \`${prefix}play <song>\` → download\n` +
              `┃ \`${prefix}addtoplaylist\` → adds last song\n` +
              `┃ \`${prefix}addtoplaylist <name>\` → manual add\n` +
              `┃\n` +
              `┃ *View & Play:*\n` +
              `┃ \`${prefix}myplaylist\` → see all songs\n` +
              `┃ \`${prefix}playlistplay <#>\` → play by number\n` +
              `┃\n` +
              `┃ *Manage:*\n` +
              `┃ \`${prefix}playlistremove <#>\` → remove song\n` +
              `┃ \`${prefix}playlistremove <name>\` → remove by name\n` +
              `┃ \`${prefix}playlistclear confirm\` → clear all\n` +
              `┃\n` +
              `┃ _Max 50 songs per playlist_\n` +
              `╰━────────━`
    }, { quoted: fake });
}

module.exports = {
    addToPlaylistCommand,
    myPlaylistCommand,
    playlistPlayCommand,
    playlistRemoveCommand,
    playlistClearCommand,
    playlistHelpCommand,
    setLastSong,
    getLastSong
};

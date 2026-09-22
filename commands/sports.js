const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

const TIMEOUT = 20000;
const SPORTS_API = 'https://apis.prexzyvilla.site/sports/football';

async function getSportsData() {
    const { data } = await axios.get(SPORTS_API, { timeout: TIMEOUT });
    return data;
}

function tn(name) {
    return name ? name.replace(' FC', '').replace(' Utd.', ' United') : 'TBD';
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'TBD';
    return new Date(timestamp).toLocaleString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

async function livescoreCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '⚽', key: message.key } });
        const data = await getSportsData();
        
        if (!data.status) throw new Error('API error');
        
        const matches = data.data?.matches || [];
        if (!matches.length) return sock.sendMessage(chatId, { text: '❌ No matches found right now.' }, { quoted: createFakeContact(message) });
        
        const rows = matches.slice(0, 15).map(m => {
            const homeScore = m.homeScore ?? 0;
            const awayScore = m.awayScore ?? 0;
            const matchTime = formatTimestamp(m.matchTime_t);
            const status = m.state === 0 ? '⏳ Upcoming' : m.state === 1 ? '🟢 Live' : '✅ Finished';
            const weather = m.weather ? ` 🌡️ ${m.weather}` : '';
            
            return `┃ *${tn(m.homeName)}* ${homeScore} - ${awayScore} *${tn(m.awayName)}*\n┃ 📅 ${matchTime} | ${status}${weather}`;
        }).join('\n┃\n');
        
        const text = `╭─[ *⚽ Live Football Scores* ]\n┃\n${rows}\n╰━────────━`;
        return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
        
    } catch (err) {
        console.error('[livescore] error:', err.message);
        return sock.sendMessage(chatId, { text: `❌ Could not fetch live scores.\n${err.message}` }, { quoted: createFakeContact(message) });
    }
}

async function eplCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🏴', key: message.key } });
        const data = await getSportsData();
        const matches = data.data?.matches?.filter(m => m.leagueEn?.toLowerCase().includes('premier') || m.leagueEn?.toLowerCase().includes('epl')) || [];
        
        if (!matches.length) return sock.sendMessage(chatId, { text: '❌ No EPL matches found.' }, { quoted: createFakeContact(message) });
        
        const rows = matches.slice(0, 10).map(m => {
            const homeScore = m.homeScore ?? 0;
            const awayScore = m.awayScore ?? 0;
            const matchTime = formatTimestamp(m.matchTime_t);
            return `┃ *${tn(m.homeName)}* ${homeScore} - ${awayScore} *${tn(m.awayName)}*\n┃ 📅 ${matchTime}`;
        }).join('\n┃\n');
        
        const text = `╭─[ *🏴󠁧󠁢󠁥󠁮󠁧󠁿 EPL Matches* ]\n┃\n${rows}\n╰━────────━`;
        return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
    } catch (err) {
        return sock.sendMessage(chatId, { text: '❌ Failed to fetch EPL data.' }, { quoted: createFakeContact(message) });
    }
}

async function laligaCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🇪🇸', key: message.key } });
        const data = await getSportsData();
        const matches = data.data?.matches?.filter(m => m.leagueEn?.toLowerCase().includes('laliga') || m.leagueEn?.toLowerCase().includes('la liga')) || [];
        
        if (!matches.length) return sock.sendMessage(chatId, { text: '❌ No La Liga matches found.' }, { quoted: createFakeContact(message) });
        
        const rows = matches.slice(0, 10).map(m => {
            const homeScore = m.homeScore ?? 0;
            const awayScore = m.awayScore ?? 0;
            const matchTime = formatTimestamp(m.matchTime_t);
            return `┃ *${tn(m.homeName)}* ${homeScore} - ${awayScore} *${tn(m.awayName)}*\n┃ 📅 ${matchTime}`;
        }).join('\n┃\n');
        
        const text = `╭─[ *🇪🇸 La Liga Matches* ]\n┃\n${rows}\n╰━────────━`;
        return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
    } catch (err) {
        return sock.sendMessage(chatId, { text: '❌ Failed to fetch La Liga data.' }, { quoted: createFakeContact(message) });
    }
}

async function uclCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🏆', key: message.key } });
        const data = await getSportsData();
        const matches = data.data?.matches?.filter(m => m.leagueEn?.toLowerCase().includes('champions') || m.leagueEn?.toLowerCase().includes('ucl')) || [];
        
        if (!matches.length) return sock.sendMessage(chatId, { text: '❌ No UCL matches found.' }, { quoted: createFakeContact(message) });
        
        const rows = matches.slice(0, 10).map(m => {
            const homeScore = m.homeScore ?? 0;
            const awayScore = m.awayScore ?? 0;
            const matchTime = formatTimestamp(m.matchTime_t);
            return `┃ *${tn(m.homeName)}* ${homeScore} - ${awayScore} *${tn(m.awayName)}*\n┃ 📅 ${matchTime}`;
        }).join('\n┃\n');
        
        const text = `╭─[ *🏆 Champions League Matches* ]\n┃\n${rows}\n╰━────────━`;
        return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
    } catch (err) {
        return sock.sendMessage(chatId, { text: '❌ Failed to fetch UCL data.' }, { quoted: createFakeContact(message) });
    }
}

async function bundesligaCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🇩🇪', key: message.key } });
        const data = await getSportsData();
        const matches = data.data?.matches?.filter(m => m.leagueEn?.toLowerCase().includes('bundesliga')) || [];
        
        if (!matches.length) return sock.sendMessage(chatId, { text: '❌ No Bundesliga matches found.' }, { quoted: createFakeContact(message) });
        
        const rows = matches.slice(0, 10).map(m => {
            const homeScore = m.homeScore ?? 0;
            const awayScore = m.awayScore ?? 0;
            const matchTime = formatTimestamp(m.matchTime_t);
            return `┃ *${tn(m.homeName)}* ${homeScore} - ${awayScore} *${tn(m.awayName)}*\n┃ 📅 ${matchTime}`;
        }).join('\n┃\n');
        
        const text = `╭─[ *🇩🇪 Bundesliga Matches* ]\n┃\n${rows}\n╰━────────━`;
        return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
    } catch (err) {
        return sock.sendMessage(chatId, { text: '❌ Failed to fetch Bundesliga data.' }, { quoted: createFakeContact(message) });
    }
}

async function serieaCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🇮🇹', key: message.key } });
        const data = await getSportsData();
        const matches = data.data?.matches?.filter(m => m.leagueEn?.toLowerCase().includes('serie a')) || [];
        
        if (!matches.length) return sock.sendMessage(chatId, { text: '❌ No Serie A matches found.' }, { quoted: createFakeContact(message) });
        
        const rows = matches.slice(0, 10).map(m => {
            const homeScore = m.homeScore ?? 0;
            const awayScore = m.awayScore ?? 0;
            const matchTime = formatTimestamp(m.matchTime_t);
            return `┃ *${tn(m.homeName)}* ${homeScore} - ${awayScore} *${tn(m.awayName)}*\n┃ 📅 ${matchTime}`;
        }).join('\n┃\n');
        
        const text = `╭─[ *🇮🇹 Serie A Matches* ]\n┃\n${rows}\n╰━────────━`;
        return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
    } catch (err) {
        return sock.sendMessage(chatId, { text: '❌ Failed to fetch Serie A data.' }, { quoted: createFakeContact(message) });
    }
}

// ─── COMING SOON COMMANDS ─────────────────────────────────────────────────────

async function betTipsCommand(sock, chatId, message) {
    return sock.sendMessage(chatId, { text: '⏳ Coming Soon: Betting Tips feature.' }, { quoted: createFakeContact(message) });
}

async function footballNewsCommand(sock, chatId, message) {
    return sock.sendMessage(chatId, { text: '⏳ Coming Soon: Football News feature.' }, { quoted: createFakeContact(message) });
}

async function playerSearchCommand(sock, chatId, message) {
    return sock.sendMessage(chatId, { text: '⏳ Coming Soon: Player Search feature.' }, { quoted: createFakeContact(message) });
}

async function teamSearchCommand(sock, chatId, message) {
    return sock.sendMessage(chatId, { text: '⏳ Coming Soon: Team Search feature.' }, { quoted: createFakeContact(message) });
}

async function venueSearchCommand(sock, chatId, message) {
    return sock.sendMessage(chatId, { text: '⏳ Coming Soon: Venue Search feature.' }, { quoted: createFakeContact(message) });
}

async function gameEventsCommand(sock, chatId, message) {
    return sock.sendMessage(chatId, { text: '⏳ Coming Soon: Match Events feature.' }, { quoted: createFakeContact(message) });
}

async function standingsCommand(sock, chatId, message) {
    return sock.sendMessage(chatId, { text: '⏳ Coming Soon: League Standings feature.' }, { quoted: createFakeContact(message) });
}

async function scorersCommand(sock, chatId, message) {
    return sock.sendMessage(chatId, { text: '⏳ Coming Soon: Top Scorers feature.' }, { quoted: createFakeContact(message) });
}

async function sportsHelpCommand(sock, chatId, message) {
    const text =
        `╭─[ *⚽ Sports Commands* ]\n` +
        `┃\n` +
        `┃ *Live Scores*\n` +
        `┃◆ .livescore — All live matches\n` +
        `┃\n` +
        `┃ *League Matches*\n` +
        `┃◆ .epl — Premier League\n` +
        `┃◆ .laliga — La Liga\n` +
        `┃◆ .ucl — Champions League\n` +
        `┃◆ .bundesliga — Bundesliga\n` +
        `┃◆ .seriea — Serie A\n` +
        `┃\n` +
        `┃ *Coming Soon ⏳*\n` +
        `┃◆ .standings, .scorers, .bettips\n` +
        `┃◆ .fnews, .player, .team, .venue\n` +
        `╰━────────━`;
    return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
}

module.exports = {
    livescoreCommand,
    eplCommand,
    laligaCommand,
    uclCommand,
    bundesligaCommand,
    serieaCommand,
    betTipsCommand,
    footballNewsCommand,
    playerSearchCommand,
    teamSearchCommand,
    venueSearchCommand,
    gameEventsCommand,
    standingsCommand,
    scorersCommand,
    sportsHelpCommand,
};
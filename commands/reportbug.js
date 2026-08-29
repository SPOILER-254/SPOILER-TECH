async function reportBugCommand(sock, chatId, message, userMessage, settings) {
    const sender = message.key.participant || message.key.remoteJid;
    const text = userMessage.split(" ").slice(1).join(" "); // everything after .reportbug

    if (!text) {
        await sock.sendMessage(chatId, { text: `Please describe the issue.\n\nExample: ${settings.prefix}reportbug Play command isn't working` }, { quoted: message });
        return;
    }

    // format bug report
    const bugReportMsg = `
*BUG REPORT*

*User*: @${sender.split("@")[0]}
*Issue*: ${text}
*Version*: ${settings.version || "2.0.0"}
    `;

    const confirmationMsg = `
Hi ${message.pushName || "there"}, 👋

Your bug report has been forwarded to my developer.  
Please wait for a reply. ✅

*Details sent:*
${bugReportMsg}
    `;

    try {
        // Forward to OWNER (replace number with yours if different)
        const ownerJid = "255778428557@s.whatsapp.net";

        await sock.sendMessage(ownerJid, { text: bugReportMsg, mentions: [sender] });
        await sock.sendMessage(chatId, { text: confirmationMsg, mentions: [sender] }, { quoted: message });

    } catch (err) {
        console.error("reportBugCommand error:", err);
        await sock.sendMessage(chatId, { text: "Failed to send bug report." }, { quoted: message });
    }
}

module.exports = reportBugCommand;


async function chaneljidCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        // Extract args from the message text
        let args = [];
        if (text) {
            // Split text by spaces and remove the command part
            args = text.trim().split(/\s+/).slice(1);
        }
        
        let targetJid = null;

        // 1️⃣ If a link or JID is provided
        if (args[0]) {
            const input = args[0];

            // Newsletter JID directly
            if (input.endsWith('@newsletter')) {
                targetJid = input;
            }
            // WhatsApp channel/newsletter link
            else if (input.includes('whatsapp.com/channel/')) {
                const code = input.split('/').pop().trim();
                targetJid = `120363${code}@newsletter`; // Fixed template literal
            }
            else {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: '❌ Invalid channel link or JID'
                    },
                    { quoted: message }
                );
            }
        }
        // 2️⃣ If no argument, use current chat JID
        else {
            targetJid = message.key.remoteJid;
        }

        // 3️⃣ Final validation
        if (!targetJid.endsWith('@newsletter')) {
            return await sock.sendMessage(
                chatId,
                {
                    text: 'This is not a WhatsApp channel/newsletter\n\n' +
                          'Tip:\n' +
                          '.channeljid <channel link or JID>'
                },
                { quoted: message }
            );
        }

        // 4️⃣ Output ONLY the JID (clean & obvious)
        await sock.sendMessage(
            chatId,
            {
                text: `${targetJid}` // Fixed template literal
            },
            { quoted: message }
        );

    } catch (err) {
        console.error('ChannelJID Error:', err);

        await sock.sendMessage(
            chatId,
            {
                text: 'Failed to fetch channel JID'
            },
            { quoted: message }
        );
    }
}

module.exports = { chaneljidCommand };

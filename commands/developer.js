const fs = require('fs');
const path = require('path');

// Developer data
const developers = [
    {
        name: "Supremelord",
        phone: "254143914610"
    },
    {
        name: "Supreme lord", 
        phone: "254101512806"
    },
    {
        name: "Spoiler Bm",
        phone: "254108487451"
    },
    {
        name: "Spoiler bm",
        phone: "254729550976"
    },
    {
        name: "faviannah",
        phone: "254142733317"
    }
];

async function developerCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, {
            text: '👨‍💻 Fetching developer contacts...'
        }, { quoted: message });

        // Create temp directory
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Send each developer as separate VCF
        for (const dev of developers) {
            const vcfContent = `BEGIN:VCARD
VERSION:3.0
FN:${dev.name}
TEL;TYPE=CELL:${dev.phone}
NOTE:Bot Developer
END:VCARD`;

            const fileName = `${dev.name.replace(/[^\w]/g, '_')}.vcf`;
            const filePath = path.join(tempDir, fileName);
            
            fs.writeFileSync(filePath, vcfContent, 'utf8');
            
            await sock.sendMessage(chatId, {
                document: fs.readFileSync(filePath),
                fileName: fileName,
                mimetype: 'text/vcard'
            });

            // Delete file after sending
            fs.unlinkSync(filePath);
            
            // Small delay between sends
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Send summary message
        await sock.sendMessage(chatId, {
            text: `✅ *${developers.length} Developer Contacts Sent*\n\n` +
                  `💡 *How to import:*\n` +
                  `1. Download all .vcf files\n` +
                  `2. Open Contacts app\n` +
                  `3. Import from storage\n` +
                  `4. Select all vcf files\n\n` +
                  `*All contacts are in international format.*`
        }, { quoted: message });

    } catch (error) {
        console.error('Developer command error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to send developer contacts.'
        }, { quoted: message });
    }
}

module.exports = developerCommand;

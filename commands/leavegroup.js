async function leaveGroupCommand(sock, chatId, message) {
    try {
        const isOwner = message.key.fromMe;
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: 'This command is only available for the owner!',
                quoted: message
            });
            return;
        }

        const chat = await sock.groupMetadata(chatId).catch(() => null);
        if (!chat) {
            await sock.sendMessage(chatId, { 
                text: 'This command only works in groups!',
                quoted: message
            });
            return;
        }

        const groupName = chat.subject || 'the group';
        const participantsCount = chat.participants?.length || 0;
        
        await sock.sendMessage(chatId, { 
            text: `*👋 Goodbye everyone! it was nice being in ${groupName}.*`,
            quoted: message
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await sock.groupLeave(chatId);
        
        console.log(`Bot left group: ${groupName} (Participants: ${participantsCount})`);

    } catch (error) {
        console.error('Error in leaveGroupCommand:', error);
        
        let errorMessage = 'Failed to leave group!';
        if (error.message.includes('not in group')) {
            errorMessage = 'Bot is not a participant in this group!';
        } else if (error.message.includes('not authorized')) {
            errorMessage = 'Bot does not have permission to leave this group!';
        }
        
        await sock.sendMessage(chatId, { 
            text: errorMessage,
            quoted: message
        }).catch(() => {});
    }
}

module.exports = leaveGroupCommand;

// Simple storage for pending requests
const pendingRequests = new Map();

async function pendingRequestsCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ This command only works in groups!' 
            });
        }

        const requests = pendingRequests.get(chatId) || [];
        
        if (requests.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '📭 No pending requests.\n\nTo add a request:\nUse .request @user' 
            });
        }

        let text = `*Pending Requests: ${requests.length}*\n\n`;
        
        requests.forEach((req, index) => {
            text += `${index + 1}. @${req.split('@')[0]}\n`;
        });

        text += `\nUse:\n• .approveall to approve all\n• .rejectall to reject all`;

        await sock.sendMessage(chatId, { 
            text: text,
            mentions: requests
        });

    } catch (error) {
        await sock.sendMessage(chatId, { 
            text: '❌ Error' 
        });
    }
}

async function approveAllCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ This command only works in groups!' 
            });
        }

        const requests = pendingRequests.get(chatId) || [];
        
        if (requests.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: 'No requests to approve.' 
            });
        }

        for (const userJid of requests) {
            try {
                // Add user to group
                await sock.groupParticipantsUpdate(
                    chatId,
                    [userJid],
                    'add'
                );
                // Small delay between adds
                await new Promise(r => setTimeout(r, 1000));
            } catch (error) {
                // Continue even if one fails
            }
        }

        // Clear after approving
        pendingRequests.delete(chatId);
        
        await sock.sendMessage(chatId, { 
            text: `✅ Approved ${requests.length} request(s)!` 
        });

    } catch (error) {
        await sock.sendMessage(chatId, { 
            text: '❌ Bot needs admin permissions to add members.' 
        });
    }
}

async function rejectAllCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ This command only works in groups!' 
            });
        }

        const requests = pendingRequests.get(chatId) || [];
        
        if (requests.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '📭 No requests to reject.' 
            });
        }

        // Just clear the requests (rejecting means not adding them)
        pendingRequests.delete(chatId);
        
        await sock.sendMessage(chatId, { 
            text: `❌ Rejected ${requests.length} request(s)!` 
        });

    } catch (error) {
        await sock.sendMessage(chatId, { 
            text: '❌ Error' 
        });
    }
}

// Add a single request manually
async function addRequestCommand(sock, chatId, message, userMessage) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ This command only works in groups!' 
            });
        }

        // Get mentioned users
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentionedJids.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Please mention a user!\nExample: .request @username' 
            });
        }

        const userToAdd = mentionedJids[0];
        
        // Initialize array if not exists
        if (!pendingRequests.has(chatId)) {
            pendingRequests.set(chatId, []);
        }
        
        const requests = pendingRequests.get(chatId);
        
        // Check if already in requests
        if (requests.includes(userToAdd)) {
            return await sock.sendMessage(chatId, { 
                text: '⚠️ User already in pending requests.' 
            });
        }
        
        // Add to requests
        requests.push(userToAdd);
        
        await sock.sendMessage(chatId, { 
            text: `✅ Added @${userToAdd.split('@')[0]} to pending requests.\n\nUse .pending to see all requests.`,
            mentions: [userToAdd]
        });

    } catch (error) {
        await sock.sendMessage(chatId, { 
            text: '❌ Error adding request' 
        });
    }
}

// Clear all requests
async function clearRequestsCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { 
                text: '❌ This command only works in groups!' 
            });
        }

        const requests = pendingRequests.get(chatId) || [];
        
        if (requests.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: '📭 No requests to clear.' 
            });
        }

        pendingRequests.delete(chatId);
        
        await sock.sendMessage(chatId, { 
            text: `🧹 Cleared ${requests.length} pending request(s).` 
        });

    } catch (error) {
        await sock.sendMessage(chatId, { 
            text: '❌ Error' 
        });
    }
}

module.exports = {
    pendingRequestsCommand,
    approveAllCommand,
    rejectAllCommand,
    addRequestCommand,
    clearRequestsCommand
};

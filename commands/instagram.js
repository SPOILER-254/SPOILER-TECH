const { igdl } = require("ruhend-scraper");
const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Function to extract unique media URLs with simple deduplication
const { createFakeContact } = require('../lib/fakeContact');
function extractUniqueMedia(mediaData) {
    const uniqueMedia = [];
    const seenUrls = new Set();
    
    for (const media of mediaData) {
        if (!media.url) continue;
        
        // Only check for exact URL duplicates
        if (!seenUrls.has(media.url)) {
            seenUrls.add(media.url);
            uniqueMedia.push(media);
        }
    }
    
    return uniqueMedia;
}

// Function to validate media URL
function isValidMediaUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Accept any URL that looks like media
    return url.includes('cdninstagram.com') || 
           url.includes('instagram') || 
           url.includes('http');
}

// Drex API fallback function
async function downloadWithDrex(url) {
    try {
        const apiUrl = `https://api.drexapp.space/downloader/igdlv2?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;
        
        if (data?.status && data?.result?.media && data.result.media.length > 0) {
            const mediaArray = [];
            for (const media of data.result.media) {
                if (media.download_url) {
                    mediaArray.push({
                        url: media.download_url,
                        type: media.type || (media.download_url.includes('.mp4') ? 'video' : 'image'),
                        thumbnail: media.thumbnail
                    });
                }
            }
            return { data: mediaArray };
        }
        return null;
    } catch (error) {
        console.error('Drex API fallback error:', error.message);
        return null;
    }
}

async function instagramCommand(sock, chatId, message) {
    try {
        // Check if message has already been processed
        if (processedMessages.has(message.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(message.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(message.key.id);
        }, 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "📸 *Instagram Downloader*\n\nPlease provide an Instagram link.\n\nExample: `.ig https://www.instagram.com/reel/DZUZswPALq9/`"
            }, { quoted: createFakeContact(message) });
        }

        // Check for various Instagram URL formats
        const instagramPatterns = [
            /https?:\/\/(?:www\.)?instagram\.com\//,
            /https?:\/\/(?:www\.)?instagr\.am\//,
            /https?:\/\/(?:www\.)?instagram\.com\/p\//,
            /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
            /https?:\/\/(?:www\.)?instagram\.com\/tv\//
        ];

        const isValidUrl = instagramPatterns.some(pattern => pattern.test(text));
        
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { 
                text: "❌ That is not a valid Instagram link. Please provide a valid Instagram post, reel, or video link."
            }, { quoted: createFakeContact(message) });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        // Try ruhend-scraper first
        let downloadData = null;
        let usedFallback = false;
        
        try {
            downloadData = await igdl(text);
            if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
                throw new Error('No data from primary scraper');
            }
        } catch (primaryError) {
            console.error('Primary scraper failed, trying fallback:', primaryError.message);
            // Try Drex API as fallback
            downloadData = await downloadWithDrex(text);
            usedFallback = true;
            
            if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
                return await sock.sendMessage(chatId, { 
                    text: "❌ No media found at the provided link. The post might be private, the link is invalid, or both download methods failed."
                }, { quoted: createFakeContact(message) });
            }
        }
        
        const mediaData = downloadData.data;
        
        // Simple deduplication - just remove exact URL duplicates
        const uniqueMedia = extractUniqueMedia(mediaData);
        
        // Limit to maximum 20 unique media items
        const mediaToDownload = uniqueMedia.slice(0, 20);
        
        if (mediaToDownload.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: "❌ No valid media found to download. This might be a private post or the scraper failed."
            }, { quoted: createFakeContact(message) });
        }

        // Send source info if using fallback
        if (usedFallback) {
            await sock.sendMessage(chatId, {
                text: "⚠️ Primary downloader failed. Using fallback API...",
                react: { text: '🔄', key: message.key }
            });
        }

        // Download all media silently without status messages
        for (let i = 0; i < mediaToDownload.length; i++) {
            try {
                const media = mediaToDownload[i];
                const mediaUrl = media.url;

                // Check if URL ends with common video extensions
                const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                              media.type === 'video' || 
                              text.includes('/reel/') || 
                              text.includes('/tv/');

                if (isVideo) {
                    await sock.sendMessage(chatId, {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4",
                        caption: usedFallback ? "📥 Downloaded via Fallback API" : ""
                    }, { quoted: createFakeContact(message) });
                } else {
                    await sock.sendMessage(chatId, {
                        image: { url: mediaUrl },
                        caption: usedFallback ? "📥 Downloaded via Fallback API" : ""
                    }, { quoted: createFakeContact(message) });
                }
                
                // Add small delay between downloads to prevent rate limiting
                if (i < mediaToDownload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (mediaError) {
                console.error(`Error downloading media ${i + 1}:`, mediaError);
                // Continue with next media if one fails
            }
        }
        
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (error) {
        console.error('Error in Instagram command:', error);
        await sock.sendMessage(chatId, { 
            text: "❌ An error occurred while processing the Instagram request. Please try again."
        }, { quoted: createFakeContact(message) });
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
    }
}

module.exports = instagramCommand;
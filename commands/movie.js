const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function movieCommand(sock, chatId, message) {
    try {
        // Initial reaction
        await sock.sendMessage(chatId, {
            react: { text: '🎬', key: message.key }
        });

        // Extract text safely
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            '';

        if (!text.includes(' ')) {
            return await sock.sendMessage(
                chatId,
                {
                    text: '🎬 *Movie Information Search*\n\n❌ Please provide a movie title!\n\n📝 *Usage:*\n.movie Home\n.movie Inception\n.movie Avengers\n\n🔍 *Examples:*\n• .movie Titanic\n• .movie Interstellar\n• .movie Spider-Man'
                },
                { quoted: createFakeContact(message) }
            );
        }

        const parts = text.split(' ');
        const movieTitle = parts.slice(1).join(' ').trim();

        if (!movieTitle) {
            return await sock.sendMessage(
                chatId,
                {
                    text: '🎬 *Movie Information Search*\n\n❌ Please provide a movie title!\n\n📝 *Example:*\n.movie The Matrix'
                },
                { quoted: createFakeContact(message) }
            );
        }

        if (movieTitle.length > 100) {
            return await sock.sendMessage(
                chatId,
                {
                    text: '🎬 *Movie Information Search*\n\n📝 Movie title too long! Max 100 characters.\n\n💡 Try a shorter movie title.'
                },
                { quoted: createFakeContact(message) }
            );
        }

        // Show "recording" presence
        await sock.sendPresenceUpdate('recording', chatId);

        // Step 1: Search for movies
        const searchUrl = `https://apis.prexzyvilla.site/moviesearch?query=${encodeURIComponent(movieTitle)}`;
        const searchResponse = await axios.get(searchUrl, { timeout: 30000 });

        if (!searchResponse.data?.status || searchResponse.data?.total_results === 0) {
            throw new Error('Movie not found');
        }

        // Get the first result
        const firstResult = searchResponse.data.results[0];
        
        // Step 2: Get detailed movie info using the URL from search
        const detailUrl = `https://apis.prexzyvilla.site/moviedetail?url=${encodeURIComponent(firstResult.url)}`;
        const detailResponse = await axios.get(detailUrl, { timeout: 30000 });

        if (!detailResponse.data?.status) {
            throw new Error('Failed to get movie details');
        }

        const movie = detailResponse.data;

        // Success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

        // Build caption using the response structure
        let caption = `🎬 *${movie.title}*`;
        if (movie.year) caption += ` (${movie.year})`;
        caption += `\n\n`;

        if (movie.rating && movie.rating !== '') caption += `⭐ *Rating:* ${movie.rating}/10\n`;
        if (movie.duration && movie.duration !== '') caption += `⏱ *Duration:* ${movie.duration}\n`;
        if (movie.quality && movie.quality !== '') caption += `📺 *Quality:* ${movie.quality}\n`;
        
        if (movie.categories && movie.categories.length > 0) {
            caption += `🎭 *Genre:* ${movie.categories.join(', ')}\n`;
        }
        
        if (movie.countries && movie.countries.length > 0) {
            caption += `📍 *Country:* ${movie.countries.join(', ')}\n`;
        }

        if (movie.trailerUrl && movie.trailerUrl !== null) {
            caption += `🎥 *Trailer:* ${movie.trailerUrl}\n`;
        }

        caption += `\n🔗 *Watch:* ${movie.url}\n`;

        // Send movie info with thumbnail if available
        const msgPayload = { caption };
        if (movie.thumbnail && movie.thumbnail !== '') {
            msgPayload.image = { url: movie.thumbnail };
        }

        await sock.sendMessage(chatId, msgPayload, { quoted: createFakeContact(message) });

        // Final reaction
        await sock.sendMessage(chatId, {
            react: { text: '🎥', key: message.key }
        });
        
    } catch (error) {
        console.error('Movie command error:', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data
        });

        // Error reaction
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        let errorMessage;
        if (error.response?.status === 400) {
            errorMessage = 'Invalid request! Please provide a valid movie title.';
        } else if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
            errorMessage = 'Movie search timed out! Try again.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Cannot connect to movie database!';
        } else if (error.response?.status === 429) {
            errorMessage = 'Too many movie search requests! Please wait.';
        } else if (error.response?.status >= 500) {
            errorMessage = 'Movie database is currently unavailable.';
        } else if (error.message.includes('Movie not found')) {
            errorMessage = `Movie "${movieTitle}" not found in database!\n\n💡 Try:\n• Checking spelling\n• Using a different title\n• Shorter keywords`;
        } else {
            errorMessage = `Error: ${error.message}`;
        }

        await sock.sendMessage(
            chatId,
            {
                text: `🎬 *Movie Information Search*\n\n🚫 ${errorMessage}\n\n📝 *Example:*\n.movie Home\n.movie Inception\n.movie Avatar`
            },
            { quoted: createFakeContact(message) }
        );
    }
}

module.exports = movieCommand;
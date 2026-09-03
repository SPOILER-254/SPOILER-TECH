const axios = require('axios');
const yts = require('yt-search');

module.exports = async function rylixCommand(sock, chatId, message, rylixArgs) {
  const command = rylixArgs[0]?.toLowerCase();
  const query = rylixArgs.slice(1).join(' ');

  if (!query) {
    return await sock.sendMessage(chatId, { 
      text: `❌ Please provide a title or YouTube link.\n\nExample:\n• .play Alan Walker Faded\n• .vidmate Believer` 
    }, { quoted: message });
  }

  // ─── AUDIO DOWNLOADERS (.play, .rymp3, .rylixmp3) ───
  if (['play', 'rymp3', 'rylixmp3'].includes(command)) {
    try {
      await sock.sendMessage(chatId, { text: `🔍 Searching YouTube for: *${query}*...` }, { quoted: message });

      const search = await yts(query);
      const video = search.videos[0];
      if (!video) {
        return await sock.sendMessage(chatId, { text: '❌ No results found on YouTube.' }, { quoted: message });
      }

      await sock.sendMessage(chatId, { text: `🎵 Downloading Audio:\n*${video.title}* (${video.timestamp})` }, { quoted: message });

      const apiUrl = `https://api.dreaded.site/api/ytdl/audio?url=${encodeURIComponent(video.url)}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.result && response.data.result.downloadUrl) {
        await sock.sendMessage(chatId, {
          audio: { url: response.data.result.downloadUrl },
          mimetype: 'audio/mp4',
          fileName: `${video.title}.mp3`
        }, { quoted: message });
      } else {
        throw new Error('Download server unresponsive.');
      }
    } catch (error) {
      console.error('Play command error:', error);
      await sock.sendMessage(chatId, { text: `❌ Audio download failed: ${error.message}` }, { quoted: message });
    }
    return;
  }

  // ─── VIDEO DOWNLOADERS (.vidmate, .vm, .rylixyt, .ryt) ───
  if (['vidmate', 'vm', 'rylixyt', 'ryt'].includes(command)) {
    try {
      await sock.sendMessage(chatId, { text: `🔍 Searching YouTube for video: *${query}*...` }, { quoted: message });

      const search = await yts(query);
      const video = search.videos[0];
      if (!video) {
        return await sock.sendMessage(chatId, { text: '❌ No results found on YouTube.' }, { quoted: message });
      }

      await sock.sendMessage(chatId, { text: `🎬 Downloading Video:\n*${video.title}* (${video.timestamp})` }, { quoted: message });

      const apiUrl = `https://api.dreaded.site/api/ytdl/video?url=${encodeURIComponent(video.url)}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.result && response.data.result.downloadUrl) {
        await sock.sendMessage(chatId, {
          video: { url: response.data.result.downloadUrl },
          caption: `🎥 *${video.title}*\n⏱️ Duration: ${video.timestamp}`,
          mimetype: 'video/mp4'
        }, { quoted: message });
      } else {
        throw new Error('Download server unresponsive.');
      }
    } catch (error) {
      console.error('Vidmate command error:', error);
      await sock.sendMessage(chatId, { text: `❌ Video download failed: ${error.message}` }, { quoted: message });
    }
    return;
  }
};

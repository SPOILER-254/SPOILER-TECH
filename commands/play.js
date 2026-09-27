const { spoiler, toPtt } = require("../spoiler");
const yts = require("yt-search");
const axios = require("axios");
const { sendButtons } = require("gifted-btns");

function extractButtonId(msg) {
    if (!msg) return null;
    if (msg.templateButtonReplyMessage?.selectedId)
        return msg.templateButtonReplyMessage.selectedId;
    if (msg.buttonsResponseMessage?.selectedButtonId)
        return msg.buttonsResponseMessage.selectedButtonId;
    if (msg.listResponseMessage?.singleSelectReply?.selectedRowId)
        return msg.listResponseMessage.singleSelectReply.selectedRowId;
    if (msg.interactiveResponseMessage) {
        const nf = msg.interactiveResponseMessage.nativeFlowResponseMessage;
        if (nf?.paramsJson) {
            try { const p = JSON.parse(nf.paramsJson); if (p.id) return p.id; } catch {}
        }
        return msg.interactiveResponseMessage.buttonId || null;
    }
    return null;
}

const isValidBuffer = (buf) => Buffer.isBuffer(buf) && buf.length > 10240;

const audioEndpoints = [
  'ytmp3v2',
  'ytaudio',
  'yta',
  'ytmp3',
  'savetubemp3',
  'savemp3'
];

// Query primary API endpoints
async function queryAPI(query, endpoints, conText, timeout = 15000) {
  const ApiUrl = conText.SpoilerApi || conText.GiftedTechApi || "https://api.giftedtech.my.id";
  const ApiKey = conText.SpoilerApiKey || conText.GiftedApiKey || "gifted-md";

  const attempts = endpoints.map(endpoint => {
    const apiUrl = `${ApiUrl}/api/download/${endpoint}?apikey=${ApiKey}&url=${encodeURIComponent(query)}`;
    return axios.get(apiUrl, { timeout })
      .then(res => {
        if (res.data?.success && res.data?.result?.download_url) {
          return { success: true, download_url: res.data.result.download_url };
        }
        throw new Error(`${endpoint}: no download_url`);
      });
  });

  try {
    return await Promise.any(attempts);
  } catch {
    return { success: false };
  }
}

// Zero-Key Public Fallback Engine (Runs if primary API fails)
async function fetchPublicFallback(videoUrl) {
  const publicApis = [
    `https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`,
    `https://api.dreaded.site/api/ytdl/video?url=${encodeURIComponent(videoUrl)}`
  ];

  for (const url of publicApis) {
    try {
      const res = await axios.get(url, { timeout: 15000 });
      const downloadUrl = res.data?.result?.download?.url || res.data?.result?.url || res.data?.download_url;
      if (downloadUrl) return downloadUrl;
    } catch {
      continue;
    }
  }
  return null;
}

spoiler(
  {
    pattern: "play",
    aliases: ["ytmp3", "ytmp3doc", "audiodoc", "yta"],
    category: "downloader",
    react: "🎶",
    description: "Download Audio from Youtube",
  },
  async (from, Spoiler, conText) => {
    const {
      q,
      reply,
      react,
      botPic,
      botName,
      botFooter,
      spoilerBuffer,
      formatAudio,
    } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a song name or YouTube link.");
    }

    try {
      const searchResponse = await yts(q);

      if (!searchResponse.videos.length) {
        await react("❌");
        return reply("No video found for your query.");
      }

      const firstVideo = searchResponse.videos[0];
      const videoUrl = firstVideo.url;
      
      await react("🔍");

      let downloadUrl = null;

      // Primary API query
      const endpointResult = await queryAPI(videoUrl, audioEndpoints, conText);
      if (endpointResult.success) {
        downloadUrl = endpointResult.download_url;
      }

      // If primary API failed, try public keyless fallback
      if (!downloadUrl) {
        downloadUrl = await fetchPublicFallback(videoUrl);
      }

      if (!downloadUrl) {
        await react("❌");
        return reply("Download services are temporarily busy. Please try again in a few moments.");
      }

      let bufferRes = await spoilerBuffer(downloadUrl);

      if (!isValidBuffer(bufferRes)) {
        // Final fallback attempt if buffer fetch failed
        const backupUrl = await fetchPublicFallback(videoUrl);
        if (backupUrl) bufferRes = await spoilerBuffer(backupUrl);
      }

      if (!isValidBuffer(bufferRes)) {
        await react("❌");
        return reply("Failed to process audio file. Please try again.");
      }

      // Large file handling
      if (bufferRes.length > 60 * 1024 * 1024) {
        await react("📄");
        const convertedBuffer = await formatAudio(bufferRes);
        await Spoiler.sendMessage(from, {
          document: convertedBuffer,
          mimetype: "audio/mpeg",
          fileName: `${firstVideo.title}.mp3`.replace(/[^\w\s.-]/gi, ""),
          caption: `⿻ *Title:* ${firstVideo.title}\n⿻ *Duration:* ${firstVideo.timestamp}\n\n_File too large for streaming — sent as document._`,
        });
        return;
      }

      const dateNow = Date.now();
      const buttonId = `play_${firstVideo.id}_${dateNow}`;
      
      await sendButtons(Spoiler, from, {
        title: `${botName || "SPOILER-TECH"} 𝐒𝐎𝐍𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑`,
        text: `⿻ *Title:* ${firstVideo.title}\n⿻ *Duration:* ${firstVideo.timestamp}\n\n*Select download format:*`,
        footer: botFooter || "> *POWERED BY SPOILER-TECH*",
        image: { url: firstVideo.thumbnail || botPic },
        buttons: [
          { id: `audio_${buttonId}`, text: "Audio 🎶" },
          { id: `doc_${buttonId}`, text: "Audio Document 📄" },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "Watch on Youtube",
              url: firstVideo.url,
            }),
          },
        ],
      });

      const handleResponse = async (event) => {
        const messageData = event.messages[0];
        if (!messageData?.message) return;

        const selectedButtonId = extractButtonId(messageData.message);
        if (!selectedButtonId) return;

        const isFromSameChat = messageData.key?.remoteJid === from;
        if (!isFromSameChat || !selectedButtonId.includes(dateNow.toString())) return;

        await react("⬇️");

        try {
          const convertedBuffer = await formatAudio(bufferRes);

          if (selectedButtonId.startsWith("audio_")) {
            await Spoiler.sendMessage(
              from,
              {
                audio: convertedBuffer,
                mimetype: "audio/mpeg",
              },
              { quoted: messageData }
            );
          } else if (selectedButtonId.startsWith("doc_")) {
            await Spoiler.sendMessage(
              from,
              {
                document: convertedBuffer,
                mimetype: "audio/mpeg",
                fileName: `${firstVideo.title}.mp3`.replace(/[^\w\s.-]/gi, ""),
                caption: `${firstVideo.title}`,
              },
              { quoted: messageData }
            );
          }

          await react("✅");
        } catch (error) {
          console.error("Error sending media:", error);
          await react("❌");
          await Spoiler.sendMessage(from, { text: "Failed to send audio." }, { quoted: messageData });
        }
      };

      Spoiler.ev.on("messages.upsert", handleResponse);

      setTimeout(() => {
        Spoiler.ev.off("messages.upsert", handleResponse);
      }, 300000);
      
    } catch (error) {
      console.error("Error during download process:", error);
      await react("❌");
      return reply("Oops! Something went wrong. Please try again.");
    }
  },
);

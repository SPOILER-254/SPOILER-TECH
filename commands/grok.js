const axios = require('axios');
const { createFakeContact } = require('../lib/fakeContact');

async function grokCommand(sock, chatId, message) {
  try {
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || 
                 message.text;

    if (!text) {
      return sendMsg(sock, chatId, message, "Please provide a question after !grok\n\nExample: !grok What is quantum computing?");
    }
    
    const [command, ...rest] = text.split(' ');
    const query = rest.join(' ').trim();

    if (!query) {
      return sendMsg(sock, chatId, message, "❌ Please provide a query.\nExample: !grok What is quantum computing?");
    }
    
    await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });
    await handleGrok(sock, chatId, message, query);

  } catch (err) {
    console.error('Grok Command Error:', err);
    await sendMsg(sock, chatId, message, "❌ An error occurred. Please try again later.");
  }
}

async function handleGrok(sock, chatId, message, query) {
  try {
    // ✅ Using WORKING Drex Groq API (Llama 3.3 70B)
    const url = `https://api.drexapp.space/ai/groq?q=${encodeURIComponent(query)}`;
    
    const { data } = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000
    });

    if (data?.status && data?.result?.reply) {
      const reply = data.result.reply;
      const model = data.result.model;
      
      // Optional: Add model info to response
      await sendMsg(sock, chatId, message, `${reply}\n\n🤖 *Model:* ${model}`);
    } else {
      await sendMsg(sock, chatId, message, "❌ API returned an error.");
    }

  } catch (err) {
    console.error('Grok API Error:', err);
    
    let errorMessage = "⚠️ Failed to get response from AI.";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "❌ Request timeout. Please try again.";
    } else if (err.response?.status === 429) {
      errorMessage = "❌ Rate limit exceeded. Please try again later.";
    } else if (err.response?.status) {
      errorMessage = `❌ API Error (Status: ${err.response.status}).`;
    }
    
    await sendMsg(sock, chatId, message, errorMessage);
  }
}

async function sendMsg(sock, chatId, message, text) {
  return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
}

module.exports = grokCommand;
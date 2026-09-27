const fs = require("fs");
if (fs.existsSync("config.env")) {
  require("dotenv").config({ path: "./config.env" });
}

function convertToBool(text, trueValue = "true") {
  return text === trueValue;
}

module.exports = {
  // Session
  SESSION_ID: process.env.SESSION_ID || "SPOILER-TECH~YOUR_SESSION_ID_HERE",

  // Bot Personalization & Branding
  BOT_NAME: process.env.BOT_NAME || "SPOILER-TECH",
  OWNER_NAME: process.env.OWNER_NAME || "SPOILER-254",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "254111382424",
  BOT_PIC: process.env.BOT_PIC || "https://files.catbox.moe/8s0j54.jpg",
  FOOTER: process.env.FOOTER || "> *POWERED BY SPOILER-TECH*",
  PREFIX: process.env.PREFIX || ".",

  // Public Downloader API (Pre-configured for zero-setup deployment)
  SPOILER_API: process.env.SPOILER_API || "https://api.giftedtech.my.id",
  SPOILER_API_KEY: process.env.SPOILER_API_KEY || "gifted-md",
  SpoilerApi: process.env.SPOILER_API || "https://api.giftedtech.my.id",
  SpoilerApiKey: process.env.SPOILER_API_KEY || "gifted-md",

  // Fallback API Aliases
  GiftedTechApi: process.env.GIFTED_TECH_API || "https://api.giftedtech.my.id",
  GiftedApiKey: process.env.GIFTED_API_KEY || "gifted-md",

  // Mode & Permissions
  MODE: process.env.MODE || "public",
  SUDO: process.env.SUDO ? process.env.SUDO.split(",") : ["254111382424"],

  // Bot Features & Behaviors
  AUTO_REACT: convertToBool(process.env.AUTO_REACT, "true"),
  AUTO_READ_STATUS: convertToBool(process.env.AUTO_READ_STATUS, "true"),
  AUTO_LIKE_STATUS: convertToBool(process.env.AUTO_LIKE_STATUS, "true"),
  AUTO_RECORDING: convertToBool(process.env.AUTO_RECORDING, "false"),
  AUTO_TYPING: convertToBool(process.env.AUTO_TYPING, "false"),
  ALWAYS_ONLINE: convertToBool(process.env.ALWAYS_ONLINE, "true"),
  ANTI_CALL: convertToBool(process.env.ANTI_CALL, "false"),
  ANTI_DELETE: convertToBool(process.env.ANTI_DELETE, "true"),
  ANTI_LINK: convertToBool(process.env.ANTI_LINK, "true"),
  BAD_NO_BLOCK: convertToBool(process.env.BAD_NO_BLOCK, "false"),
  READ_MESSAGE: convertToBool(process.env.READ_MESSAGE, "false"),
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Update '${__filename}'`);
  delete require.cache[file];
  require(file);
});

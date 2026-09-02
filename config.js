require('dotenv').config();

global.APIs = {
  // --- CORE OLD ---
  xteam: 'https://api.xteam.xyz',
  dzx: 'https://api.dhamzxploit.my.id',
  lol: 'https://api.lolhuman.xyz',
  violetics: 'https://violetics.pw',
  neoxr: 'https://api.neoxr.my.id',
  zenzapis: 'https://zenzapis.xyz',
  akuari: 'https://api.akuari.my.id',
  akuari2: 'https://apimu.my.id',
  nrtm: 'https://fg-nrtm.ddns.net',
  bg: 'http://bochil.ddns.net',
  fgmods: 'https://api-fgmods.ddns.net',
  
  // --- DOWNLOADER ---
  tiktok: 'https://api.lolhuman.xyz',
  instagram: 'https://api.lolhuman.xyz',
  facebook: 'https://api.lolhuman.xyz',
  youtube: 'https://api.lolhuman.xyz',
  yta: 'https://api.lolhuman.xyz',
  ytv: 'https://api.lolhuman.xyz',
  vidmate: 'https://api.vidmate-official.my.id',
  
  // --- ANIME ---
  anilab: 'https://api.jikan.moe',
  anilist: 'https://graphql.anilist.co',
  crunchyroll: 'https://api.lolhuman.xyz',

  // --- BROWSER / SEARCH ---
  google: 'https://api.lolhuman.xyz',
  chrome: 'https://api.duckduckgo.com',
  opera: 'https://api.duckduckgo.com',
  bing: 'https://api.bing.microsoft.com',

  // --- AI ALL ---
  openai: 'https://api.openai.com/v1',
  chatgpt: 'https://api.openai.com/v1',
  gpt4: 'https://api.neoxr.my.id',
  metaai: 'https://www.blackbox.ai',
  gemini: 'https://generativelanguage.googleapis.com',
  deepseek: 'https://api.deepseek.com',
  deepseek_ai: 'https://api.deepseek.com',
  claude: 'https://api.anthropic.com',
  blackbox: 'https://www.blackbox.ai',
  questionai: 'https://api.akuari.my.id'
};

global.APIKeys = {
  'https://api.xteam.xyz': process.env.XTEAM_KEY || 'd90a9e986e18778b',
  'https://api.lolhuman.xyz': process.env.LOLHUMAN_KEY || '85faf7170545d1407659ad',
  'https://api.neoxr.my.id': process.env.NEoxR_KEY || 'yourkey',
  'https://violetics.pw': process.env.VIOLETICS_KEY || 'beta',
  'https://zenzapis.xyz': process.env.ZENZ_KEY || 'yourkey',
  'https://api-fgmods.ddns.net': process.env.FGMODS_KEY || 'fg-dylux',
  'https://api.jikan.moe': 'free',
  'https://graphql.anilist.co': 'free',
  'https://api.duckduckgo.com': 'free',
  'https://api.vidmate-official.my.id': 'free',
  'https://api.deepseek.com': process.env.DEEPSEEK_KEY || 'free',
  'https://api.openai.com/v1': process.env.OPENAI_KEY || 'sk-xxx',
  'https://generativelanguage.googleapis.com': process.env.GEMINI_KEY || 'free',
  'https://www.blackbox.ai': 'free',
  'https://api.akuari.my.id': 'free'
};

module.exports = {
  SESSION_ID: global.SESSION_ID || process.env.SESSION_ID,
  WARN_COUNT: 3,
  APIs: global.APIs,
  APIKeys: global.APIKeys
};

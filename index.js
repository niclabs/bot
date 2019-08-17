const bot = require('./bot');

const { TELEGRAM_TOKEN } = process.env;
if (!TELEGRAM_TOKEN) {
  console.error('Please set the TELEGRAM_TOKEN environment variable');
  process.exit(1);
}

// Set token
bot.token = process.env.TELEGRAM_TOKEN;

bot.launch();

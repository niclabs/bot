const Bot = require('./bot');

const { TELEGRAM_TOKEN } = process.env;
if (!TELEGRAM_TOKEN) {
  console.error('Please set the TELEGRAM_TOKEN environment variable');
  process.exit(1);
}

const bot = new Bot(process.env.TELEGRAM_TOKEN);

bot.launch();

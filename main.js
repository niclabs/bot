const Telegraf = require('telegraf');
const scheduler = require('node-schedule');
const session = require('telegraf/session');

const { TELEGRAM_TOKEN } = process.env;
if (!TELEGRAM_TOKEN) {
  console.log('Please set the TELEGRAM_TOKEN environment variable');
  process.exit(1);
}

class User {
  constructor(ctx) {
    this.id = ctx.from.id;
    this.name = ctx.from.username;
    this.chat = ctx.chat.id;
    this.sendMessage = ctx.replyWithMarkdown;
    if (ctx.telegram.sendMessage) {
      this.sendMessage = (msg) => ctx.telegram.sendMessage(this.id, msg, { parse_mode: 'Markdown' });
    }
  }

  scheduleJob(rule, fn) {
    if (this.job) {
      this.job.cancel();
    }
    this.job = scheduler.scheduleJob(rule, fn);
  }
}

const bot = new Telegraf(TELEGRAM_TOKEN);
bot.use(session());

const setUp = (ctx) => {
  let { user } = ctx.session;

  // Only register the user once per chat
  if (!user) {
    user = new User(ctx);
  }

  // Do not register user for messages on private mode
  if (user.id !== user.chat) {
    user.sendMessage(
      `*Bienvenido al grupo!!*
  
  Yo te ayudaré organizarte en tus tareas diarias y la coordinación con tus compañeros.
  `,
    );

    ctx.session.user = user;
    console.log(`@${ctx.message.from.username} has been registered`);
  }
};

bot.on('message', (ctx) => {
  setUp(ctx);
});

bot.on('new_chat_members', (ctx) => {
  setUp(ctx);
});

bot.launch();

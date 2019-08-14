const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');

const User = require('./user');
const StandupScene = require('./standup');

const { TELEGRAM_TOKEN } = process.env;
if (!TELEGRAM_TOKEN) {
  console.error('Please set the TELEGRAM_TOKEN environment variable');
  process.exit(1);
}

// Escape telegram markdown
const escape = (s) => s
  .replace('_', '\\_')
  .replace('*', '\\*')
  .replace('[', '\\[')
  .replace('`', '\\`');

// Show help
const help = (ctx) => {
  ctx.replyWithMarkdown(`Hola @${ctx.from.username}!, soy @${escape(
    ctx.me,
  )}, estos son los comandos que entiendo:

- /help       mostrar esta ayuda`);
};

const getUserFromContext = (ctx) => {
  let { user } = ctx.session;

  // Check if user already exists
  if (!user) {
    user = new User(ctx);
  }

  // Add context to user
  user.join(ctx);

  // Update the user session just in case
  ctx.session.user = user;

  return user;
};

const isPrivateChatContext = (ctx) => !ctx.chat || ctx.chat.id === ctx.from.id;

const confirmInPrivate = (ctx, msg, next = () => {}) => {
  ctx.telegram.sendMessage(ctx.from.id, msg, {
    parse_mode: 'Markdown',
    ...Markup.keyboard(['👍 confirmo!'])
      .resize()
      .oneTime()
      .extra(),
  });
  ctx.session.next = next;
};

const welcome = (ctx) => {
  let { user } = ctx.session;

  // Check if user already exists
  if (!user) {
    user = new User(ctx);

    // Show help the first time
    help(ctx);
  }

  ctx.session.user = user;
};

const standup = (ctx) => {
  const user = getUserFromContext(ctx);

  if (!isPrivateChatContext(ctx)) {
    confirmInPrivate(
      ctx,
      `Es hora para el standup meeting del equipo '${ctx.chat.title}', son sólo 3 preguntas. ¿Vamos?`,
      (privateCtx) => {
        user.join(privateCtx);

        // start standup scene
        privateCtx.scene.enter('standup');
      },
    );
  } else {
    ctx.reply(
      'Para iniciar el standup debes usar el comando /standup desde un grupo donde yo esté.',
    );
  }
};

// Configure stages
const stage = new Stage([StandupScene('standup')], { ttl: 300 });

// Setup bot
const bot = new Telegraf(TELEGRAM_TOKEN);

// Configure a unique session key for all user interactions
bot.use(
  session({
    getSessionKey: (ctx) => {
      if (ctx.from) {
        return `${ctx.from.id}:${ctx.from.id}`;
      }
      return null;
    },
  }),
);

// Use the above stage
bot.use(stage.middleware());

// /start command
bot.start((ctx) => welcome(ctx));

// /help command
bot.help((ctx) => help(ctx));

// /subscribe command
bot.command('__subscribe', (ctx) => {
  const user = getUserFromContext(ctx);

  // We are in a group chat, send confirm in private chat to get the contexts
  if (!isPrivateChatContext(ctx)) {
    confirmInPrivate(
      ctx,
      `¿Estás seguro que quieres suscribirte a recordatorios diarios para el standup del grupo '${ctx.chat.title}'?`,
      (privateChatCtx) => {
        user.join(privateChatCtx);

        // Schedule the standup mon-fri at 10
        user.schedule('* 0 10 * * mon-fri', () => {
          standup(ctx);
        });
      },
    );
  } else {
    ctx.reply('Para suscribirte debes usar el comando /subscribe desde un grupo donde yo esté.');
  }
});

// private confirmation
bot.hears('👍 confirmo!', (ctx) => {
  if (!isPrivateChatContext(ctx) || !ctx.session.next) {
    return;
  }

  // Call the next function
  ctx.session.next(ctx);

  // Reply message
  ctx.reply('Listo!');

  // Delete the next function
  delete ctx.session.next;
});

// /standup command
bot.command('__standup', (ctx) => standup(ctx));

bot.launch();

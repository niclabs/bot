const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');
const Scene = require('telegraf/scenes/base');

const { leave } = Stage;

const User = require('./user');
const Group = require('./group');
const { isPrivateContext } = require('./utils');

const { TELEGRAM_TOKEN } = process.env;
if (!TELEGRAM_TOKEN) {
  console.error('Please set the TELEGRAM_TOKEN environment variable');
  process.exit(1);
}

// Show help
const help = (ctx) => {
  ctx.replyWithMarkdown(`Puedes interactuar conmigo usando los siguientes comandos:

- /help       mostrar esta ayuda
- /standup    iniciar standup meeting
- /reminder   suscribirse a recordatorios para el standup`);
};

const register = (ctx) => {
  let { user, groups, standups } = ctx.session;

  // Check if user already exists
  if (!user) {
    user = new User(ctx);
  }

  if (!groups) {
    groups = {};
  }

  if (isPrivateContext(ctx)) {
    ctx.session.privateCtx = ctx;
  } else if (!(ctx.chat.id in groups)) {
    groups[ctx.chat.id] = new Group(ctx);
  }

  if (!standups) {
    standups = {};
  }

  ctx.session.user = user;
  ctx.session.groups = groups;
  ctx.session.standups = standups;

  // Delete session group
  delete ctx.session.group;
};

const performCommandInPrivate = (ctx, cmd = () => {}) => {
  // Register context just in case this is the first command executed
  register(ctx);

  if (!isPrivateContext(ctx)) {
    ctx.session.group = ctx.session.groups[ctx.chat.id];
  }

  if (!isPrivateContext(ctx) && !ctx.session.privateCtx) {
    ctx.session.cmd = cmd;
    ctx.telegram.sendMessage(
      ctx.from.id,
      `Para evitar el spam prefiero ejecutar el comando ${ctx.message.text} en privado. ¿Está bien?`,
      Markup.keyboard(['👍 entiendo'])
        .resize()
        .oneTime()
        .extra(),
    );
  } else if (ctx.session.privateCtx) {
    cmd(ctx.session.privateCtx);
  }
};

const showGroupSelector = (ctx, msg = 'Escoge un grupo') => {
  const { groups } = ctx.session;

  if (!groups || Object.keys(groups).length === 0) {
    return false;
  }

  ctx.reply(
    msg,
    Markup.keyboard([Object.keys(groups).map((id) => groups[id].name)])
      .resize()
      .oneTime()
      .extra(),
  );

  return true;
};

const findGroupByName = (ctx, name) => {
  const { groups } = ctx.session;

  return Object.keys(groups)
    .map((id) => groups[id])
    .find((group) => group.name === name);
};

const welcome = (ctx) => {
  register(ctx);

  ctx.telegram.sendMessage(
    ctx.from.id,
    `Hola @${ctx.from.username}! Un gusto de conocerte, ni nombre es soy @${ctx.me}. Si quieres saber más de mi puedes usar el comando /help`,
  );
};

// Greeter scene
const reminder = new Scene('reminder');
reminder.enter((ctx) => {
  const { group } = ctx.session;

  if (group) {
    ctx.reply(
      `Voy configurar un recordatorio para el equipo '${group.name}. ¿Está bien?'`,
      Markup.keyboard([['👍 ok', '👎 me arrepentí']])
        .resize()
        .oneTime()
        .extra(),
    );
  } else if (!showGroupSelector(ctx, 'Escoge un grupo para el recordatorio')) {
    ctx.reply(
      'Aun no te tengo registrado en ningún equipo 😥. Prueba ejecutando el comando /reminder desde un grupo en donde yo esté',
    );
    ctx.scene.leave();
  }
});
reminder.hears('👍 ok', (ctx) => {
  const { group } = ctx.session;
  ctx.reply(`Listo, te recordaré todos los días a las 10AM del standup del equipo '${group.name}'`);

  // TODO: set job

  ctx.scene.leave();
});
reminder.hears('👎 me arrepentí', (ctx) => {
  ctx.reply('No hay problema');
  ctx.scene.leave();
});
reminder.hears(/.+/, (ctx) => {
  const group = findGroupByName(ctx, ctx.match[0]);

  if (group) {
    ctx.session.group = group;

    ctx.reply(`Listo, te recordaré todos los días a las 10AM del standup del equipo '${group.name}'`);

    // TODO: set job
  } else {
    ctx.reply('Lo siento, no entendí tu respuesta');
    ctx.scene.leave();
  }
});

// Create scene manager
const stage = new Stage();
stage.command('cancel', leave());

// Scene registration
stage.register(reminder);

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

// Use the stage middleware
bot.use(stage.middleware());

// /start command
bot.start((ctx) => welcome(ctx));

// /help command
bot.help((ctx) => help(ctx));

bot.command('reminder', (ctx) => {
  performCommandInPrivate(ctx, (privateCtx) => {
    privateCtx.scene.enter('reminder');
  });
});

// private confirmation
bot.hears('👍 entiendo', (ctx) => {
  if (!isPrivateContext(ctx) || !ctx.session.cmd) {
    return;
  }

  // Call the next function
  ctx.session.cmd(ctx);

  // Delete the command
  delete ctx.session.cmd;
});

bot.launch();

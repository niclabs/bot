const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Markup = require('telegraf/markup');

const { leave } = Stage;

const User = require('./user');
const Group = require('./group');
const getReminderScene = require('./reminder');
const getStandupScene = require('./standup');

const { isPrivateContext } = require('./utils');

// Show help
const help = (ctx) => {
  ctx.reply(`Puedes interactuar conmigo usando los siguientes comandos:

- /help       mostrar esta ayuda
- /standup    iniciar standup meeting
- /cancel     cancelar el comando en curso`);
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
  delete ctx.session.fromGroup;
};

const performCommandInPrivate = (ctx, cmd = () => {}) => {
  // Register context just in case this is the first command executed
  register(ctx);

  if (!isPrivateContext(ctx)) {
    ctx.session.fromGroup = ctx.session.groups[ctx.chat.id];
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

const welcome = (ctx) => {
  register(ctx);

  ctx.telegram.sendMessage(
    ctx.from.id,
    `Hola @${ctx.from.username}! Un gusto de conocerte, ni nombre es @${ctx.me}. Si quieres saber más de mi puedes usar el comando /help`,
  );
};

// Create scene manager
const stage = new Stage();
stage.command('cancel', (ctx) => {
  ctx.reply('OK', Markup.removeKeyboard().extra());
  return leave();
});

// Scene registration
stage.register(getReminderScene('reminder'));
stage.register(getStandupScene('standup'));

class Bot extends Telegraf {
  constructor(token, options) {
    super(token, options);

    // Configure a unique session key for all user interactions
    this.use(
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
    this.use(stage.middleware());

    // /start command
    this.start((ctx) => welcome(ctx));

    // /help command
    this.help((ctx) => help(ctx));

    this.command('standup', (ctx) => {
      performCommandInPrivate(ctx, (privateCtx) => {
        privateCtx.scene.enter('standup');
      });
    });

    // private confirmation
    this.hears('👍 entiendo', (ctx) => {
      if (!isPrivateContext(ctx) || !ctx.session.cmd) {
        return;
      }

      // save the private context just in case
      ctx.session.privateCtx = ctx;

      // Call the next function
      ctx.session.cmd(ctx);

      // Delete the command
      delete ctx.session.cmd;
    });
  }
}

module.exports = Bot;

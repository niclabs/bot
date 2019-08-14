const WizardScene = require('telegraf/scenes/wizard');
const Markup = require('telegraf/markup');

class Standup {
  constructor(user) {
    this.user = user;
  }

  yesterday(answer) {
    this.yesterday = answer;
  }

  today(answer) {
    this.today = answer;
  }

  obstacles(answer) {
    this.obstacles = answer;
  }

  msg(msg, extra = {}) {
    this.user.replyToUser(msg, extra);
  }
}

const StandupScene = (name) => new WizardScene(
  name,
  (ctx) => {
    const { user } = ctx.session;

    // Should never happen
    if (!user) {
      console.error('No user in scene context');
      return ctx.scene.leave();
    }

    ctx.session.standup = new Standup(user);

    ctx.session.standup.msg(`1. ¿Que hiciste ayer?
  
  _Ojo: puedes responder en múltiples líneas usando Ctrl+Enter_`);

    return ctx.wizard.next();
  },
  (ctx) => {
    console.log('standup step 2');
    ctx.session.standup.yesterday(ctx.message.text);

    ctx.session.standup.msg('2. ¿Que harás hoy?');

    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.session.standup.today(ctx.message.text);

    ctx.session.standup.msg('3. ¿Tienes algún obstáculo para avanzar?');

    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.session.standup.obstacles(ctx.message.text);

    ctx.session.standup.msg(
      `Gracias por tus respuestas.
  
  Procederé a postear el siguiente mensaje al grupo ${ctx.session.user.chat.title}
  
  *En que trabajé ayer*
  ${ctx.session.standup.yesterday}
  
  *En que estaré trabajando hoy*
  ${ctx.session.standup.yesterday}
  
  *¿Tienes algún obstáculo para avanzar?*
  ${ctx.session.standup.obstacles}
  
  ¿Confirmas tus respuestas?
      `,
      Markup.inlineKeyboard([
        Markup.callbackButton('😱noo', 'cancel').Markup.callbackButton('👍si, dale', 'next'),
      ]).extra(),
    );

    return ctx.wizard.next();
  },
  (ctx) => {
    console.log(ctx.message.data);
  },
);

module.exports = StandupScene;

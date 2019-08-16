const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');

const { showGroupSelector, findGroupByName } = require('./utils');

module.exports = (name) => {
  const reminder = new Scene(name);

  // On enter scene
  reminder.enter((ctx) => {
    const { fromGroup } = ctx.session;

    if (fromGroup) {
      ctx.reply(
        `Voy configurar un recordatorio para el equipo '${fromGroup.name}. ¿Está bien?'`,
        Markup.keyboard([['👍 ok', '👎 me arrepentí']])
          .resize()
          .oneTime()
          .extra(),
      );
    } else if (!showGroupSelector(ctx, 'Escoge un grupo para el recordatorio')) {
      ctx.reply(
        `Aun no te tengo registrado en ningún equipo 😥. Prueba ejecutando el comando ${ctx.message.text} desde un grupo en donde yo esté`,
      );
      ctx.scene.leave();
    }
  });
  reminder.hears('👍 ok', (ctx) => {
    const { fromGroup, user, privateCtx } = ctx.session;
    ctx.reply(
      `Listo, te recordaré todos los días a las 10AM del standup del equipo '${fromGroup.name}'`,
    );

    // set job
    user.schedule('standup', '* 0 10 * * mon-fri', () => {
      ctx.session.fromGroup = fromGroup;

      privateCtx.scene.enter('standup');
    });

    ctx.scene.leave();
  });
  reminder.hears('👎 me arrepentí', (ctx) => {
    ctx.reply('No hay problema');
    ctx.scene.leave();
  });
  reminder.hears(/.+/, (ctx) => {
    const { user, privateCtx } = ctx.session;
    const fromGroup = findGroupByName(ctx, ctx.match[0]);

    if (fromGroup) {
      ctx.reply(
        `Listo, te recordaré todos los días a las 10AM del standup del equipo '${fromGroup.name}'`,
      );

      user.schedule('standup', '* 0 10 * * mon-fri', () => {
        ctx.session.fromGroup = fromGroup;

        privateCtx.scene.enter('standup');
      });

      ctx.scene.leave();
    } else {
      ctx.reply('Lo siento, no entendí tu respuesta');
    }
  });

  return reminder;
};

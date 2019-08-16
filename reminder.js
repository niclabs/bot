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
    const { fromGroup } = ctx.session;
    ctx.reply(
      `Listo, te recordaré todos los días a las 10AM del standup del equipo '${fromGroup.name}'`,
    );

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
      ctx.reply(
        `Listo, te recordaré todos los días a las 10AM del standup del equipo '${group.name}'`,
      );

      // TODO: set job

      ctx.scene.leave();
    } else {
      ctx.reply('Lo siento, no entendí tu respuesta');
    }
  });

  return reminder;
};
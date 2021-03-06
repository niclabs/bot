const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');

const {
  showGroupSelector, findGroupByName, strdate, nomarkdown,
} = require('./utils');

class Standup {
  constructor(user, group, date = new Date()) {
    this.user = user;
    this.group = group;
    this.date = date;
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

  toString() {
    return `Standup de @${nomarkdown(this.user.name)} para ${
      strdate(this.date) === strdate(new Date()) ? 'hoy' : strdate(this.date)
    }

*¿Que hiciste ayer?*
${this.yesterday || '-'}

*¿Que harás hoy?*
${this.today || '‍‍-'}

*¿Tienes algún obstáculo para avanzar?*
${this.obstacles || '-'}`;
  }
}

function getStandupScene(name) {
  const StandupStage = Object.freeze({
    begin: Symbol('begin'),
    yesterday: Symbol('yesterday'),
    today: Symbol('today'),
    obstacles: Symbol('obstacles'),
    confirm: Symbol('confirm'),
  });

  const scene = new Scene(name);

  // On enter scene
  scene.enter((ctx) => {
    const { fromGroup, standups } = ctx.session;

    // First stage
    ctx.scene.state.stage = StandupStage.begin;

    if (fromGroup) {
      if (
        standups
        && fromGroup.id in standups
        && strdate(standups[fromGroup.id].date) === strdate()
      ) {
        ctx.reply(
          `Ya hiciste el standup de hoy para el equipo '${fromGroup.name}'. Felicitaciones!`,
          Markup.removeKeyboard(true).extra(),
        );
        ctx.scene.leave();
        return;
      }

      ctx.reply(
        `Es hora de iniciar el standup para el equipo '${fromGroup.name}'. Son sólo 3 preguntas. ¿Vamos?`,
        Markup.keyboard([['👍 vamos!', '👎 no, gracias']])
          .resize()
          .oneTime()
          .extra(),
      );
    } else if (!showGroupSelector(ctx, 'Escoge un grupo para hacer el standup o usa /cancel para cancelar')) {
      ctx.reply(
        `Aun no te tengo registrado en ningún equipo 😥. Prueba ejecutando el comando ${ctx.message.text} desde un grupo en donde yo esté`,
      );
      ctx.scene.leave();
    }
  });

  scene.hears('👍 vamos!', (ctx) => {
    const { user, fromGroup } = ctx.session;
    const { stage } = ctx.scene.state;

    switch (stage) {
      case StandupStage.begin:
        ctx.scene.state.stage = StandupStage.yesterday;
        ctx.scene.state.standup = new Standup(user, fromGroup);

        ctx.replyWithMarkdown(
          `1. ¿Que hiciste ayer? 
          
_Ojo: puedes usar Ctrl+enter para escribir mútiples líneas_`,
          Markup.removeKeyboard().extra(),
        );
        break;
      default:
        break;
    }
  });

  scene.hears(['👎 no, gracias', '😳 me arrepentí'], (ctx) => {
    ctx.reply('No hay problema', Markup.removeKeyboard().extra());
    ctx.scene.leave();
  });

  scene.hears('👍 dale!', (ctx) => {
    const { standup, stage } = ctx.scene.state;

    switch (stage) {
      case StandupStage.confirm:
        // Update session standup and post message
        ctx.session.standups[standup.group.id] = standup;
        standup.group.reply(standup.toString(), { parse_mode: 'Markdown' });
        ctx.reply('Hecho!', Markup.removeKeyboard().extra());

        ctx.scene.leave();
        break;
      default:
        break;
    }
  });

  scene.hears(/.+/, (ctx) => {
    const { user, standups } = ctx.session;
    const { standup, stage } = ctx.scene.state;
    let fromGroup;

    switch (stage) {
      case StandupStage.begin:
        // group selection
        fromGroup = findGroupByName(ctx, ctx.match[0]);

        if (fromGroup) {
          if (
            standups
            && fromGroup.id in standups
            && strdate(standups[fromGroup.id].date) === strdate()
          ) {
            ctx.reply(
              `Ya hiciste el standup de hoy para el equipo '${fromGroup.name}'. Felicitaciones!`,
              Markup.removeKeyboard().extra(),
            );
            ctx.scene.leave();
            return;
          }

          ctx.scene.state.stage = StandupStage.yesterday;
          ctx.scene.state.standup = new Standup(user, fromGroup);

          ctx.replyWithMarkdown(
            `1. ¿Que hiciste ayer? 
            
_Ojo: puedes usar Ctrl+enter para escribir mútiples líneas_`,
            Markup.removeKeyboard().extra(),
          );
        } else {
          ctx.reply('Lo siento, no entendí tu respuesta');
        }
        break;
      case StandupStage.yesterday:
        // Store previous stage answer
        standup.yesterday(
          ctx.message.text
            .split('\n')
            .map((s) => `- ${s.trim()}`)
            .join('\n'),
        );

        // Next question
        ctx.scene.state.stage = StandupStage.today;
        ctx.reply('2. ¿Que harás hoy?');
        break;
      case StandupStage.today:
        // Store previous stage answer
        standup.today(
          ctx.message.text
            .split('\n')
            .map((s) => `- ${s.trim()}`)
            .join('\n'),
        );

        // Next question
        ctx.scene.state.stage = StandupStage.obstacles;
        ctx.scene.state.answer = [];
        ctx.reply('3. ¿Tienes algún obstáculo para avanzar?');
        break;
      case StandupStage.obstacles:
        standup.obstacles(
          ctx.message.text
            .split('\n')
            .map((s) => `- ${s.trim()}`)
            .join('\n'),
        );

        // Confirm
        ctx.scene.state.stage = StandupStage.confirm;
        delete ctx.scene.state.answer;
        ctx.replyWithMarkdown(
          `Escribiré la siguiente respuesta al equipo '${nomarkdown(standup.group.name)}'

${standup
    .toString()
    .split('\n')
    .map((s) => `|  ${s.trim()}`)
    .join('\n')}

¿Confirmas tus respuestas?
  `,
          Markup.keyboard([['👍 dale!', '😳 me arrepentí']])
            .resize()
            .oneTime()
            .extra(),
        );
        break;
      default:
        break;
    }
  });

  return scene;
}

module.exports = getStandupScene;

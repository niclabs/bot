const Markup = require('telegraf/markup');

// Format given date or return current date formatted
// as yyyy-mm-dd
function strdate(when = new Date()) {
  const d = new Date(when);
  let month = `${d.getMonth() + 1}`;
  let day = `${d.getDate()}`;
  const year = d.getFullYear();

  if (month.length < 2) month = `0${month}`;
  if (day.length < 2) day = `0${day}`;

  return [year, month, day].join('-');
}

// Escape telegram markdown
const nomarkdown = (s) => s
  .replace('_', '\\_')
  .replace('*', '\\*')
  .replace('[', '\\[')
  .replace('`', '\\`');

const isPrivateContext = (ctx) => !ctx.chat || ctx.chat.id === ctx.from.id;

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

module.exports = {
  strdate, nomarkdown, isPrivateContext, showGroupSelector, findGroupByName,
};

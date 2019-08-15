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

module.exports = { strdate, nomarkdown, isPrivateContext };

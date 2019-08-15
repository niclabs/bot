class Group {
  constructor(ctx) {
    this.id = ctx.chat.id;
    this.name = ctx.chat.title;
    this.reply = (msg, extra = {}) => ctx.telegram.sendMessage(this.id, msg, { parse_mode: 'Markdown', ...extra });
  }
}

module.exports = Group;

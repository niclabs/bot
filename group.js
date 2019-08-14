class Group {
  constructor(ctx) {
    this.id = ctx.chat.id;
    this.name = ctx.chat.title;
    this.ctx = ctx;
  }

  reply(msg, extra = {}) {
    this.ctx.reply(msg, { parse_mode: 'Markdown', ...extra });
  }
}

module.exports = Group;

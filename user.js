const scheduler = require('node-schedule');
const Group = require('./group');

class User {
  constructor(ctx) {
    this.id = ctx.from.id;
    this.name = ctx.from.username;
    this.groups = {};

    // Join the given context
    this.join(ctx);
  }

  join(ctx) {
    if (ctx.chat && ctx.chat.id !== this.id) {
      this.groups[ctx.chat.id] = new Group(ctx);
    } else {
      this.ctx = ctx;
    }
  }

  leave(ctx) {
    if (ctx.chat && ctx.chat.id !== this.id && ctx.chat.id && this.groups) {
      delete this.groups[ctx.chat.id];
    }
  }

  replyToGroup(id, msg, extra = {}) {
    if (id in this.groups) {
      this.groups[id].reply(msg, extra);
    }
  }

  replyToUser(msg, extra = {}) {
    if (this.ctx) {
      this.ctx.reply(msg, { parse_mode: 'Markdown', ...extra });
    } else {
      console.error(`Could not send message for user @${this.name}. Private context not set`);
    }
  }

  schedule(rule, fn) {
    if (this.job) {
      this.job.cancel();
    }
    this.job = scheduler.scheduleJob(rule, fn);
  }
}

module.exports = User;

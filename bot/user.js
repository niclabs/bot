const scheduler = require('node-schedule');

class User {
  constructor(ctx) {
    this.id = ctx.from.id;
    this.name = ctx.from.username;
    this.jobs = {};
    this.ctx = ctx;
  }

  reply(msg, extra = {}) {
    this.ctx.sendMessage(this.id, msg, { parse_mode: 'Markdown', ...extra });
  }

  // Schedule function to run in times set by the given rul
  // see https://www.npmjs.com/package/node-schedule
  schedule(label, rule, fn) {
    if (label in this.jobs) {
      this.jobs[label].cancel();
    }
    this.jobs[label] = scheduler.scheduleJob(rule, fn);
    return this.jobs[label];
  }
}

module.exports = User;

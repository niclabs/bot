const TelegrafTest = require('telegraf-test');
const assert = require('assert');

const bot = require('./bot');

// Configure tests
bot.token = 'ABCD:1234567890';
const test = new TelegrafTest({
  url: 'http://127.0.0.1:8888/secret-path',
});

// Configure test user
test.setUser({
  username: 'testuser',
});

// Configure bot details
test.setBot({
  username: 'testbot',
});

test.sendCommand = (command) => test.sendMessage({
  text: command,
  entities: [{ type: 'bot_command', offset: 0, length: command.length }],
});

// bot.startWebhook('/secret-path', null, 8888);
// Start webhook via launch (preffered)
bot.launch({
//   webhook: {
//     domain: 'http://127.0.0.1:8888',
//     port: 8888,
//     hookPath: '/secret-path',
//   },
// });

describe('General functions', () => {
  describe('/start', () => {
    it('should welcome user by name on start', async () => {
      const response = await test.sendCommand('/start');
      assert.strictEqual(
        response.data.text,
        'Hola @testuser! Un gusto de conocerte, ni nombre es @testbot. Si quieres saber más de mi puedes usar el comando /help',
      );
    });
  });
});

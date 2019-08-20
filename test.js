const TelegrafTest = require('telegraf-test');
const assert = require('assert');

const bot = require('./bot');

// Configure tests
const test = new TelegrafTest({ url: 'http://127.0.0.1:8888/secret-path' });

async function launch() {
  // Start telegraf-test web server
  await test.startServer();

  // Setup bot
  bot.telegram.options.apiRoot = 'http://127.0.0.1:2000';
  bot.token = 'ABCD:1234567890';

  await bot.launch({ webhook: { hookPath: '/secret-path', port: 8888 } });

  // Run mocha
  run();
}

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

describe('/start', () => {
  it('should welcome user by name on start', async () => {
    const response = await test.sendCommand('/start');
    assert.strictEqual(
      response.data.text,
      'Hola @testuser! Un gusto de conocerte, ni nombre es @testbot. Si quieres saber más de mi puedes usar el comando /help',
    );
  });
});

describe('/help', () => {
  it('should show help message', async () => {
    const response = await test.sendCommand('/help');
    if (
      !response.data.text
      || !response.data.text.includes('Puedes interactuar conmigo usando los siguientes comandos')
    ) {
      assert.fail('Response should include help message');
    }
  });
});

// Launch tests
launch();

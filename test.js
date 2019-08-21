const assert = require('assert');

const TelegramServer = require('../telegram-test-api');
const Bot = require('./bot');

describe('Bot test suite', () => {
  const serverConfig = { port: 9001 };
  const token = 'noToken';
  let server;
  let bot;

  // disable console errors
  console.error = () => {};

  beforeEach(async () => {
    server = new TelegramServer(serverConfig);
    bot = new Bot(token, { telegram: { apiRoot: server.ApiURL } });
    console.error = () => {};
    await server.start();
    await bot.launch();
  });

  afterEach(async () => {
    await bot.stop();
    await server.stop();
  });

  it('should welcome user on /start', async () => {
    const client = server.getClient(token);
    await client.sendCommand(client.makeCommand('/start'));
    const updates = await client.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply for command /start');
    }

    assert.strictEqual(
      updates.result[0].message.text,
      'Hola @testUserName! Un gusto de conocerte, ni nombre es @Test Name. Si quieres saber más de mi puedes usar el comando /help',
    );
  });

  it('should show help message on /help', async () => {
    const client = server.getClient(token);
    await client.sendCommand(client.makeCommand('/help'));
    const updates = await client.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply for command /help');
    }

    if (
      !updates.result[0].message.text.includes(
        'Puedes interactuar conmigo usando los siguientes comandos',
      )
    ) {
      assert.fail('Response should include help message');
    }
  });

  it('/standup called in group should reply in private chat', async () => {
    // Get client for a group chat
    const client = server.getClient(token, { chatId: 2, type: 'group' });
    await client.sendCommand(client.makeCommand('/standup'));
    let updates = await client.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply for command /standup');
    }

    let { message } = updates.result[0];

    // Check that reply was in privaate chat
    assert.strictEqual(message.chat_id, 1);

    // First time it should ask the user to confirm private context
    assert.strictEqual(
      message.text,
      'Para evitar el spam prefiero ejecutar el comando /standup en privado. ¿Está bien?',
    );

    const privateClient = server.getClient(token);
    await privateClient.sendMessage(privateClient.makeMessage(message.reply_markup.keyboard[0][0]));

    updates = await privateClient.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply to private chat request answer');
    }
    [{ message }] = updates.result;
    assert.strictEqual(
      message.text,
      "Es hora de iniciar el standup para el equipo 'Test Name'. Son sólo 3 preguntas. ¿Vamos?",
    );
  });
});

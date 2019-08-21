const assert = require('assert');

const TelegramServer = require('telegram-test-api');
const Bot = require('../bot');

describe('/standup from group', () => {
  const serverConfig = { port: 9001 };
  const token = 'noToken';
  let server;
  let bot;

  // disable console errors
  console.error = () => {};

  before(async () => {
    server = new TelegramServer(serverConfig);
    bot = new Bot(token, { telegram: { apiRoot: server.ApiURL } });
    console.error = () => {};
    await server.start();
    await bot.launch();
  });

  after(async () => {
    await bot.stop();
    await server.stop();
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

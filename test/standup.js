const assert = require('assert');

const TelegramServer = require('telegram-test-api');
const Bot = require('../bot');

describe('Standup meeting launch', () => {
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

  const sendCommand = async (client, cmd) => {
    await client.sendCommand(client.makeCommand(cmd));
    const updates = await client.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail(`no reply for command ${cmd}`);
    }

    return updates.result[0].message;
  };

  const sendMessage = async (client, msg) => {
    await client.sendMessage(client.makeMessage(msg));
    const updates = await client.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail(`no reply for message ${JSON.stringify(msg)}`);
    }

    return updates.result[0].message;
  };

  it('should reply in private chat when called from group', async () => {
    // Get client for a group chat
    const client = server.getClient(token, { chatId: 2, type: 'group' });
    const message = await sendCommand(client, '/standup');

    // Check that reply was in privaate chat
    assert.strictEqual(message.chat_id, 1);
  });

  it('should request confirmation the first time to get private context', async () => {
    // Get client for a group chat
    const groupClient = server.getClient(token, { chatId: 2, type: 'group' });
    let message = await sendCommand(groupClient, '/standup');

    // Check that reply was in privaate chat
    assert.strictEqual(message.chat_id, 1);

    // First time it should ask the user to confirm private context
    assert.strictEqual(
      message.text,
      'Para evitar el spam prefiero ejecutar el comando /standup en privado. ¿Está bien?',
    );

    const privateClient = server.getClient(token);
    message = await sendMessage(privateClient, message.reply_markup.keyboard[0][0]);
    assert.strictEqual(
      message.text,
      "Es hora de iniciar el standup para el equipo 'Test Name'. Son sólo 3 preguntas. ¿Vamos?",
    );
  });

  it('should reply with error message when no group information is available', async () => {
    // Get client for a group chat
    const client = server.getClient(token);
    const message = await sendCommand(client, '/standup');

    // Check that reply was in privaate chat
    assert.strictEqual(message.chat_id, 1, 'expected private chat id');

    // First time it should ask the user to confirm private context
    assert.strictEqual(
      message.text,
      'Aun no te tengo registrado en ningún equipo 😥. Prueba ejecutando el comando /standup desde un grupo en donde yo esté',
    );
  });

  it('should reply with group list when user has identified', async () => {
    // Get client for a group chat
    const groupClient = server.getClient(token, { chatId: 2, type: 'group' });
    let message = await sendCommand(groupClient, '/start');

    // Check that reply was in privaate chat
    assert.strictEqual(message.chat_id, 1);

    assert.strictEqual(
      message.text,
      'Hola @testUserName! Un gusto de conocerte, ni nombre es @Test Name. Si quieres saber más de mi puedes usar el comando /help',
    );

    const privateClient = server.getClient(token);
    message = await sendCommand(privateClient, '/standup');
    assert.strictEqual(
      message.text,
      'Escoge un grupo para hacer el standup o usa /cancel para cancelar',
    );

    assert.strictEqual(
      message.reply_markup.keyboard[0].length,
      1,
      'expected array with a single group',
    );
    assert.strictEqual(message.reply_markup.keyboard[0][0], 'Test Name');
  });

  it('should start standup in private list when user has identified', async () => {
    // Get client for a group chat
    const privateClient = server.getClient(token);
    let message = await sendCommand(privateClient, '/start');

    // Check that reply was in privaate chat
    assert.strictEqual(message.chat_id, 1);

    assert.strictEqual(
      message.text,
      'Hola @testUserName! Un gusto de conocerte, ni nombre es @Test Name. Si quieres saber más de mi puedes usar el comando /help',
    );

    const groupClient = server.getClient(token, { chatId: 2, type: 'group' });
    message = await sendCommand(groupClient, '/standup');
    assert.strictEqual(
      message.text,
      "Es hora de iniciar el standup para el equipo 'Test Name'. Son sólo 3 preguntas. ¿Vamos?",
    );

    assert.strictEqual(
      message.reply_markup.keyboard[0].length,
      2,
      'expected array with two options',
    );
    assert.strictEqual(message.reply_markup.keyboard[0][0], '👍 vamos!');
  });
});

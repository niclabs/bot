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

  it('should reply in private chat when called from group', async () => {
    // Get client for a group chat
    const client = server.getClient(token, { chatId: 2, type: 'group' });
    await client.sendCommand(client.makeCommand('/standup'));
    const updates = await client.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply for command /standup');
    }

    const { message } = updates.result[0];

    // Check that reply was in privaate chat
    assert.strictEqual(message.chat_id, 1);
  });

  it('should request confirmation the first time to get private context', async () => {
    // Get client for a group chat
    const groupClient = server.getClient(token, { chatId: 2, type: 'group' });
    await groupClient.sendCommand(groupClient.makeCommand('/standup'));
    let updates = await groupClient.getUpdates();
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

    updates = await groupClient.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply for command /standup');
    }

    [{ message }] = updates.result;
    assert.strictEqual(
      message.text,
      "Es hora de iniciar el standup para el equipo 'Test Name'. Son sólo 3 preguntas. ¿Vamos?",
    );
  });

  it('should reply with error message when no group information is available', async () => {
    // Get client for a group chat
    const client = server.getClient(token);
    await client.sendCommand(client.makeCommand('/standup'));
    const updates = await client.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply for command /standup');
    }

    const { message } = updates.result[0];

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
    await groupClient.sendCommand(groupClient.makeCommand('/start'));
    let updates = await groupClient.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply for command /start');
    }

    let { message } = updates.result[0];

    // Check that reply was in privaate chat
    assert.strictEqual(message.chat_id, 1);

    assert.strictEqual(
      message.text,
      'Hola @testUserName! Un gusto de conocerte, ni nombre es @Test Name. Si quieres saber más de mi puedes usar el comando /help',
    );

    const privateClient = server.getClient(token);
    await privateClient.sendCommand(privateClient.makeCommand('/standup'));
    updates = await groupClient.getUpdates();
    if (updates.result.length !== 1) {
      assert.fail('no reply for command /standup');
    }

    [{ message }] = updates.result;
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
});

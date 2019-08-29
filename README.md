[![Build Status](https://travis-ci.com/niclabs/bot.svg?branch=master)](https://travis-ci.com/niclabs/bot)

# bot

Telegram Bot to perform daily standup meetings for each Telegram group (or team), the bot is added to. 

For now the bot implements a single command `/standup`, which prompts the user with the 3 standup meeting questions

* What did you do yesterday?
* What will you do today?
* Do you have any obstacles for your progress?

For now all bot messages are in Spanish, although internationalization is planned.


## Getting started

### Dependencies

The bot is implemented in [Node.js](https://nodejs.org/en/) and it uses the [telegraf.js](https://telegraf.js.org) bot framework, and [yarn](https://yarnpkg.com/en/) to manage dependencies. You can install yarn using

```bash
npm install -g yarn
```

### Running the bot from source

Clone the repo with: 

```bash
git clone https://github.com/niclabs/bot.git
```

Install dependencies

```bash
cd bot
yarn
```

Run tests (optional)

```bash
yarn test
```

To run, you need an API token (you can request one contacting the [@BotFather](https://telegram.me/botfather)).

```bash
export TELEGRAM_TOKEN=<your API token>
yarn start
```

### Running the bot using docker

Assuming you have already [installed Docker](https://docs.docker.com/install/), you can obtain the latest docker image of the bot with

```bash
docker pull niclabs/bot
```

For running the bot in the foreground use the command

```bash
docker run --rm -ti -e TELEGRAM_TOKEN=<your API token> niclabs/bot
```

Or as a daemon

```bash
docker run -d -e TELEGRAM_TOKEN=<your API token> niclabs/bot
```
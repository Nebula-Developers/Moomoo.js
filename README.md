# Moomoo.js

Control [Moomoo.io](http://moomoo.io/) clients through Node.js.

## Installation

Install it with this NPM command:

    npm install git+https://github.com/Nebula-Developers/Moomoo.js.git

Alternative, use Yarn:

    yarn add https://github.com/Nebula-Developers/Moomoo.js

## Usage

This module exports the client class and a utility function that allows you to get server information to connect with.

```js
const moo = require("moomoo");

async function start() {
    const server = await moo.parseServerLink("http://moomoo.io/?server=8:21:0");

    const bot = moo.MoomooClient(server);
    bot.addEventListener("socketOpen", () => {
        bot.spawn();
    });
}
start();
```
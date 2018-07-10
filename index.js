const events = require("yaeti");
const uws = require("uws");
const request = require("request");
const waitUntil = require("async-wait-until");
const msgpack = require("msgpack");

/**
 * An event representing a raw websocket message.
 */
class RawMessageEvent extends events.Event {
	constructor(msg) {
		super("message");

		this.message = {
			type: msg[0],
			arguments: msg[1],
		};
	}
}

/**
 * A Moomoo.io client that can take and recieve actions.
 */
class MoomooClient extends events.EventTarget {
	constructor(server) {
		super();

		this.server = server;
		this.socket = new uws(`wss://ip_${this.server.ip}.moomoo.io:8008/?gameIndex=${this.server.gameIndex}`);

		this.selfID = null;

		this.socket.on("message", data => {
			const msg = msgpack.unpack(new Uint8Array(data));

			this.dispatchEvent(new RawMessageEvent(msg));

			switch (msg[0]) {
				case "1": {
					this.selfID = msg[1][0];
					break;
				}
			}
		});
		this.socket.on("open", () => {
			this.dispatchEvent(new events.Event("socketOpen"));
		});
	}

	/**
	 * Sends a message.
	 * @param {*[]} msg The message data.
	 */
	send(msg) {
		this.socket.send(msgpack.pack(msg));
	}

	/**
	 * Spawns the client in the arena.
	 * @param {string} name The name to spawn with.
	 * @param {number} skin The skin index to spawn with.
	 * @param {boolean} spawnBonus Whether to spawn with a bonus of 100 of each resource.
	 */
	spawn(name = "Bot", skin = 0, spawnBonus = true) {
		this.send([
			"1",
			[{
				name,
				skin,
				moofoll: spawnBonus,
			}],
		]);
	}
}

/**
 * A Moomoo.io game.
 */
class MoomooGame {
	constructor(serverData, gameData, gameIndex) {
		this.ip = serverData.ip;
		this.region = serverData.region;
		this.serverIndex = serverData.index;
		this.index = gameIndex;
		this.playerCount = gameData.playerCount;
		this.isPrivate = gameData.isPrivate;
	}

	/**
	 * Gets a game's identifier.
	 */
	toIdentifier() {
		return `${this.region}:${this.serverIndex}:${this.index}`;
	}
}

function getIP(link) {
	link = link.match(/\d+:\d+:\d+/g);
	if (link.length > 0) {
		return link[link.length - 1];
	} else {
		return false;
	}
}

const servers = [];
let hasServerData = false;

request.get("http://dev.moomoo.io/serverData/", (error, response) => {
	if (!error) {
		const serverResponse = JSON.parse(response.body).servers;
		serverResponse.forEach(server => {
			server.games.forEach((game, index) => {
				servers.push(new MoomooGame(server, game, index));
			});
		});
		hasServerData = true;
	}
});

/**
 * Gets server information from a party link.
 * @param {string} link The party link to parse.
 * @returns {Promise.<MoomooGame>}
 */
async function parseServerLink(link) {
	await waitUntil(() => hasServerData);

	const matching = servers.filter(server => {
		return getIP(link) === server.toIdentifier();
	});

	if (matching.length > 0) {
		return matching[0];
	} else {
		throw new Error("No server found.");
	}
}

module.exports = {
	MoomooClient,
	parseServerLink,
};
const events = require("yaeti");
const uws = require("uws");
const request = require("request");
const waitUntil = require("async-wait-until");
const msgpack = require("msgpack");

class MoomooClient extends events.EventTarget {
	constructor(server) {
		super();

		this.server = server;
		this.socket = new uws(`wss://ip_${this.server.ip}.moomoo.io:8008/?gameIndex=${this.server.gameIndex}`);

		this.selfID = null;

		this.socket.on("message", data => {
			const msg = msgpack.unpack(new Uint8Array(data));
			console.log(msg)
			switch (msg[0]) {
				case "1": {
					this.selfID = msg[1][0];
					break;
				}
			}
		});
	}

	send(msg) {
		this.socket.send(msgpack.pack(msg))
	}

	spawn(name = "Bot", skin = 0) {
		this.send([
			"1",
			{
				name,
				skin,
				moofoll: true,
			},
		]);
	}
}

class MoomooPlayer {

}

class MoomooGame {
	constructor(serverData, gameData, gameIndex) {
		this.ip = serverData.ip;
		this.region = serverData.region;
		this.serverIndex = serverData.index;
		this.index = gameIndex;
		this.playerCount = gameData.playerCount;
		this.isPrivate = gameData.isPrivate;
	}

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

let servers = [];
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
	MoomooPlayer,
	parseServerLink,
}
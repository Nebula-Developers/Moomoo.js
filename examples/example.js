const moomoo = require(".");

moo.parseServerLink("http://moomoo.io/?server=8:21:0").then(server => {
	const bot = moo.MoomooClient(server);
	
	bot.addEventListener("socketOpen", () => {
		bot.spawn("Example", 6);
		bot.direction(0, true);
	});
});

Meteor.methods({
	async pingBot(bot) {
		check(bot, Object);
		const start = process.hrtime();
		await RocketChat.sendClientCommand(bot, { key: 'heartbeat' });
		const diff = process.hrtime(start);
		return diff[1]/1000000;
	}
});

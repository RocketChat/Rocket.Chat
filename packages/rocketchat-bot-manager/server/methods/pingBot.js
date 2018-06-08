Meteor.methods({
	async pingBot(bot) {
		check(bot, Object);

		try {
			const start = process.hrtime();
			const command = await RocketChat.sendClientCommand(bot, { msg: 'heartbeat' });
			const diff = process.hrtime(start);
			RocketChat.models.ClientCommands.remove(command._id);
			return diff[1]/1000000;
		} catch (err) {
			const { command } = err.details;
			RocketChat.models.ClientCommands.remove(command._id);
			throw err;
		}
	}
});

Meteor.methods({
	pingBot(bot) {
		check(bot, Object);
		const promise = new Promise((resolve, reject) => {
			const start = process.hrtime();
			Meteor.call('sendClientCommand', bot, { msg: 'heartbeat' }, (err, command) => {
				if (err) {
					command = err.details.command;
					reject(err);
				} else {
					const diff = process.hrtime(start);
					resolve(diff[1]/1000000);
				}
				RocketChat.models.ClientCommands.remove(command._id);
			});
		});

		return promise;
	}
});

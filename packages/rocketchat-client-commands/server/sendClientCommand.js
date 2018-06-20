const commandStream = new Meteor.Streamer('client-commands');

RocketChat.sendClientCommand = (user, command, timeout = 5) => {
	const promise = new Promise((resolve, reject) => {
		check(user, Object);
		check(command, Object);
		check(command.key, String);

		const clientCommand = {
			_id: Random.id(),
			cmd: command,
			ts: new Date()
		};

		commandStream.emitWithoutBroadcast(user._id, clientCommand);

		// Avoiding linting errors while this function is incomplete
		if (clientCommand) {
			resolve(true);
		} else {
			reject(timeout);
		}
	});

	return promise;
};

import _ from 'underscore';

const commandStream = new Meteor.Streamer('client-commands');

RocketChat.sendClientCommand = (user, command, timeout = 5) => {
	const promise = new Promise((resolve, reject) => {
		check(user, Object);
		check(command, Object);
		check(command.key, String);

		const msTimeout = timeout * 1000;

		const clientCommand = {
			_id: Random.id(),
			cmd: command,
			ts: new Date()
		};

		const timeoutFunction = setTimeout(() => {
			RocketChat.removeAllListeners(`client-command-response-${ command._id }`);
			const error = new Meteor.Error('error-client-command-response-timeout',
				`${ _.escape(user.name) } didn't respond to the command in time`, {
					method: 'sendClientCommand',
					command: clientCommand
				});
			reject(error);
		}, msTimeout);

		commandStream.emitWithoutBroadcast(user._id, clientCommand);
		RocketChat.on(`client-command-response-${ command._id }`, (replyUser, response) => {
			if (user._id !== replyUser._id) {
				return;
			}
			clearTimeout(timeoutFunction);
			RocketChat.removeAllListeners(`client-command-response-${ command._id }`);
			resolve(response);
		});
	});

	return promise;
};

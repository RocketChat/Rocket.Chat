import _ from 'underscore';

const commandStream = new Meteor.Streamer('client-commands');

RocketChat.sendClientCommand = (user, command, timeout = 5) => {
	const promise = new Promise((resolve, reject) => {
		check(user, Object);
		check(command, Object);
		check(command.key, String);

		if (user._id === undefined || user.username === undefined) {
			const error = new Meteor.Error('error-invalid-user', 'Invalid user', {
				function: 'sendClientCommand'
			});
			return reject(error);
		}

		const msTimeout = timeout * 1000;

		const clientCommand = {
			_id: Random.id(),
			cmd: command,
			ts: new Date()
		};

		// rejects with timeout error if timeout was not cleared after response
		const timeoutFunction = setTimeout(() => {
			RocketChat.removeAllListeners(`client-command-response-${ command._id }`);
			const error = new Meteor.Error('error-client-command-response-timeout',
				`${ _.escape(user.name) } didn't respond to the command in time`, {
					method: 'sendClientCommand',
					command: clientCommand
				});
			reject(error);
		}, msTimeout);

		// emits the command to the user
		commandStream.emitWithoutBroadcast(user._id, clientCommand);

		// adds listener for a response event coming from replyClientCommand
		// if the response times out, the listener is removed by timeoutFunction
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

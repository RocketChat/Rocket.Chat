import _ from 'underscore';

const commandStream = new Meteor.Streamer('client-commands');

/**
 * Sends a ClientCommand object to the user via the client-commands stream
 * @param {Object} user Object of the target user
 * @param {Object} command Command to be sent, must have a 'key' property of type String
 * @param {Number} timeout Number of seconds until timeout, defaults to 5
 */
RocketChat.sendClientCommand = (user, command, timeout = 5) => {
	const promise = new Promise((resolve, reject) => {
		check(user, Object);
		check(command, Object);
		check(command.key, String);
		check(timeout, Number);

		// Must have the _id and username properties
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
			RocketChat.removeAllListeners(`client-command-response-${ clientCommand._id }`);
			const error = new Meteor.Error('error-client-command-response-timeout',
				`${ _.escape(user.name) } didn't respond to the command in time`, {
					method: 'sendClientCommand',
					command: clientCommand
				});
			reject(error);
		}, msTimeout);

		// adds listener for a response event coming from replyClientCommand
		// if the response times out, the listener is removed by timeoutFunction
		RocketChat.on(`client-command-response-${ clientCommand._id }`, (replyUser, response) => {
			if (user._id !== replyUser._id) {
				return;
			}
			clearTimeout(timeoutFunction);
			RocketChat.removeAllListeners(`client-command-response-${ clientCommand._id }`);
			resolve(response);
		});

		// emits the command to the user
		commandStream.emit(user._id, clientCommand);
	});

	return promise;
};

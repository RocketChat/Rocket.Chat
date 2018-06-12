import _ from 'underscore';

RocketChat.sendClientCommand = (user, command, timeout = 5) => {
	const promise = new Promise((resolve, reject) => {
		check(user, Object);
		check(command, Object);

		const msTimeout = timeout * 1000;

		const clientCommand = {
			u: {
				_id: user._id,
				username: user.username
			},
			cmd: command,
			ts: new Date()
		};

		const id = RocketChat.models.ClientCommands.insert(clientCommand);
		clientCommand._id = id;

		let finished = false;

		const handle = RocketChat.models.ClientCommands.find(id).observeChanges({
			changed: (id, fields) => {
				if (finished) {
					return;
				}
				finished = true;
				_.assign(clientCommand, fields);
				resolve(clientCommand);
			}
		});

		setTimeout(() => {
			const error = new Meteor.Error('error-client-command-response-timeout',
				`${ _.escape(user.name) } didn't respond to the command in time`, {
					method: 'sendClientCommand',
					command: clientCommand
				});
			handle.stop();
			if (finished) {
				return;
			}
			finished = true;
			reject(error);
		}, msTimeout);
	});

	return promise;
};

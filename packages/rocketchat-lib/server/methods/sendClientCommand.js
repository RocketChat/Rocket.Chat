import _ from 'underscore';

Meteor.methods({
	sendClientCommand(user, command, callback) {
		check(user, Object);
		check(command, Object);

		const id = RocketChat.models.ClientCommands.insert({
			u: {
				_id: user._id,
				username: user.username
			},
			cmd: command,
			ts: new Date()
		});
		let finished = false;

		const handle = RocketChat.models.ClientCommands.find(id).observeChanges({
			changed: (id, fields) => {
				if (finished) {
					return;
				}
				finished = true;
				if (callback) {
					callback(fields);
				}
			}
		});

		setTimeout(() => {
			const error = new Meteor.Error('error-client-command-response-timeout',
				`${ _.escape(user.name) } didn't respond to the command in time`, {
					method: 'sendClientCommand',
					field: command
				});
			handle.stop();
			if (finished) {
				return;
			}
			finished = true;
			throw error;
		}, 5000);
	}
});

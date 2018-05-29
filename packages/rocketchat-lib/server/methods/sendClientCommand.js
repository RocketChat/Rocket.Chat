Meteor.methods({
	sendClientCommand(user, command) {
		check(user, Object);
		check(command, String);

		return RocketChat.models.ClientCommands.insert({
			u: {
				_id: user._id,
				username: user.username
			},
			cmm: command,
			ts: new Date()
		});
	}
});

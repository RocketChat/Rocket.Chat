Meteor.methods({
	replyClientCommand(commandId, response) {
		check(commandId, String);
		check(response, Object);

		const command = RocketChat.models.ClientCommands.findOne(commandId);
		if (!command) {
			throw new Meteor.Error('error-client-command-not-found', `There is no command with id ${ commandId }`, {
				method: 'replyClientCommand',
				field: commandId
			});
		}

		return RocketChat.models.ClientCommands.update({_id: commandId}, {
			$set: {
				response
			}
		});

	}
});

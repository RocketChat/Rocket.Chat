Meteor.methods({
	replyClientCommand(commandId, response) {
		check(commandId, String);
		check(response, Object);

		// const command = RocketChat.models.ClientCommands.findOne(commandId);
		// const user = Meteor.user();

		// if (!command) {
		// 	throw new Meteor.Error('error-client-command-not-found', `There is no command with id ${ commandId }`, {
		// 		method: 'replyClientCommand',
		// 		field: commandId
		// 	});
		// }

		// if (command.u._id !== user._id) {
		// 	throw new Meteor.Error('error-client-command-not-allowed', `User ${ user.username } is not the target of command with id ${ commandId }`, {
		// 		method: 'replyClientCommand',
		// 		field: commandId
		// 	});
		// }

		// return RocketChat.models.ClientCommands.update({_id: commandId}, {
		// 	$set: {
		// 		response
		// 	}
		// });
	}
});

Meteor.methods({
	replyClientCommand(commandId, response) {
		check(commandId, String);
		check(response, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'replyClientCommand' });
		}

		// emits event with the caller user and the response object
		RocketChat.emit(`client-command-response-${ commandId }`, Meteor.user(), response);
	}
});

Meteor.methods({
	replyClientCommand(commandId, response) {
		check(commandId, String);
		check(response, Object);

		// emits event with the caller user and the response object
		RocketChat.emit(`client-command-response-${ commandId }`, Meteor.user(), response);
	}
});

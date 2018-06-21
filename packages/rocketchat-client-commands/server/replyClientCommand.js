Meteor.methods({
	replyClientCommand(commandId, response) {
		check(commandId, String);
		check(response, Object);

		RocketChat.emit(`client-command-response-${ response._id }`, Meteor.user(), response);
	}
});

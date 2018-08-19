Meteor.methods({
	replyToDdpRequest(requestId, response) {
		check(requestId, String);
		check(response, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'replyToDdpRequest' });
		}

		// emits event with the caller user and the response object
		RocketChat.emit(`ddp-request-response-${ requestId }`, Meteor.user(), response);
	},
});

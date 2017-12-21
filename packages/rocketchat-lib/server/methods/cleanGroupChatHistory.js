Meteor.methods({
	cleanGroupChatHistory({roomId}) {
		check(roomId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanChannelHistory' });
		}

		RocketChat.models.Messages.remove({
			rid: roomId
		});
	}
});

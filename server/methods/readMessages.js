Meteor.methods({
	readMessages(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages'
			});
		}

		return RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId(rid, Meteor.userId());
	}
});

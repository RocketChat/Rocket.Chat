Meteor.methods({
	openRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'openRoom'
			});
		}

		return RocketChat.models.Subscriptions.openByRoomIdAndUserId(rid, Meteor.userId());
	}
});

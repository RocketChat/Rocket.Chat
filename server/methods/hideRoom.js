Meteor.methods({
	hideRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'hideRoom'
			});
		}

		return RocketChat.models.Subscriptions.hideByRoomIdAndUserId(rid, Meteor.userId());
	}
});

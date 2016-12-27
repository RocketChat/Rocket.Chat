Meteor.methods({
	unblockUser({rid, blocked}) {

		check(rid, String);
		check(blocked, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		const subscription2 = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, blocked);

		if (!subscription || !subscription2) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		RocketChat.models.Subscriptions.unsetBlockedByRoomId(rid, blocked, Meteor.userId());

		return true;
	}
});

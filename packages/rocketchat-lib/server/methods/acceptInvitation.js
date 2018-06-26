Meteor.methods({
	acceptInvitation({message, params: {rid, userId}}) {
		check(userId, String);
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'acceptInvitation'
			});
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		if (!subscription) {
			return;
		}

		RocketChat.models.Subscriptions.setAsActiveByRoomIdAndUserId(rid, userId);
		return RocketChat.deleteMessage(message, Meteor.user());
	}
});

Meteor.methods({
	deleteOldOTRMessages: function(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('invalid-user', '[methods] deleteOldOTRMessages -> Invalid user');
		}

		const now = new Date();
		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, Meteor.userId());
		if (subscription && subscription.t === 'd') {
			RocketChat.models.Messages.deleteOldOTRMessages(roomId, now);
		} else {
			throw new Meteor.Error('invalid-room', '[methods] deleteOldOTRMessages -> Invalid room');
		}
	}
});

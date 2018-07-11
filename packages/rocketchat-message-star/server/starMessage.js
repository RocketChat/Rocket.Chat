Meteor.methods({
	starMessage(message) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'starMessage'
			});
		}

		if (!RocketChat.settings.get('Message_AllowStarring')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message starring not allowed', {
				method: 'pinMessage',
				action: 'Message_starring'
			});
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}

		return RocketChat.models.Messages.updateUserStarById(message._id, Meteor.userId(), message.starred);
	}
});

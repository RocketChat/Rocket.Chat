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

		const room = RocketChat.models.Rooms.findOneById(message.rid);
		if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
			return false;
		}

		return RocketChat.models.Messages.updateUserStarById(message._id, Meteor.userId(), message.starred);
	}
});


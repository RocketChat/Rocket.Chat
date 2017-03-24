//Action Links namespace creation.
RocketChat.actionLinks = {
	actions: {},
	register(name, funct) {
		RocketChat.actionLinks.actions[name] = funct;
	},
	getMessage(name, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: 'actionLinks.getMessage' });
		}

		const message = RocketChat.models.Messages.findOne({ _id: messageId });
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { function: 'actionLinks.getMessage' });
		}

		const room = RocketChat.models.Rooms.findOne({ _id: message.rid });
		if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { function: 'actionLinks.getMessage' });
		}

		if (!message.actionLinks || !message.actionLinks[name]) {
			throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', { function: 'actionLinks.getMessage' });
		}

		return message;
	}
};

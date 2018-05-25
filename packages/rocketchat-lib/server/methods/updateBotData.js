Meteor.methods({
	updateBotData(botData) {
		check(botData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateBotData' });
		}

		const user = Meteor.user();

		if (user.type !== 'bot') {
			throw new Meteor.Error('error-invalid-user', 'Invalid user, not bot type', { method: 'updateBotData' });
		}

		return RocketChat.updateBotData(user, botData);
	}
});

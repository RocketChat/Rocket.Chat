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

		if (botData.framework === undefined) {
			throw new Meteor.Error('error-invalid-bot-data', 'Missing framework property', { method: 'updateBotData' });
		}

		botData.ipAddress = this.connection.clientAddress;

		return RocketChat.updateBotData(user, botData);
	}
});

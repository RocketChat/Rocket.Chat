Meteor.methods({
	insertOrUpdateBot(botData) {

		check(botData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-bot', 'Invalid bot', { method: 'insertOrUpdateBot' });
		}

		return RocketChat.saveBot(Meteor.userId(), botData);
	}
});

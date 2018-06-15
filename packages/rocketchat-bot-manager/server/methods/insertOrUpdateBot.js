Meteor.methods({
	insertOrUpdateBot(botData) {

		check(botData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'insertOrUpdateBot' });
		}

		return RocketChat.saveBot(Meteor.userId(), botData);
	}
});

Meteor.methods({
	getStatistics(refresh) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getStatistics' });
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-statistics') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getStatistics' });
		}

		if (refresh) {
			return RocketChat.statistics.save();
		} else {
			return RocketChat.models.Statistics.findLast();
		}
	}
});

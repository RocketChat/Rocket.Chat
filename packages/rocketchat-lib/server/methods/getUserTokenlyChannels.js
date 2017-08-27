Meteor.methods({
	getTokenlyChannels(silenced) {
		check(silenced, Match.Optional(Boolean));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getTokenlyChannels' });
		}

		try {
			this.unblock();

			// TODO Tokenly
			// First, get combined balances of current user
			// Second, filter all channels that include each combined balances of current user and return once
		} catch(error) {
			throw new Meteor.Error('');
		}

		return [];
	}
});

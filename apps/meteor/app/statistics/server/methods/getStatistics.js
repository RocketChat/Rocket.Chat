import { Meteor } from 'meteor/meteor';

import { getLastStatistics } from '../functions/getLastStatistics';

Meteor.methods({
	async getStatistics(refresh) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getStatistics' });
		}
		return getLastStatistics({
			userId: Meteor.userId(),
			refresh,
		});
	},
});

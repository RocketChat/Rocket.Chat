import { Meteor } from 'meteor/meteor';

import { getLastStatistics } from '../functions/getLastStatistics';

Meteor.methods({
	getStatistics(refresh) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getStatistics' });
		}
		return Promise.await(
			getLastStatistics({
				userId: Meteor.userId(),
				refresh,
			}),
		);
	},
});

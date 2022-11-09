import { Meteor } from 'meteor/meteor';

import { getStatusText } from '../../../lib';

Meteor.methods({
	getUserStatusText(userId) {
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUserStatusText' });
		}

		return getStatusText(userId);
	},
});

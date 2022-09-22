import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { readMessages as readMessagesFunction } from '../lib/readMessages';

Meteor.methods({
	readMessages(rid) {
		check(rid, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		Promise.await(readMessagesFunction(rid, userId, false));
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms } from '../../app/models/server';

Meteor.methods({
	readMessages(rid: IRoom['_id']) {
		check(rid, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		Promise.await(readMessages(rid, userId, false));
	},
});

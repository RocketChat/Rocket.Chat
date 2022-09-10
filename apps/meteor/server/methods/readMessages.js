import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoom } from '../../app/authorization/server';
import { Rooms } from '../../app/models/server';
import { readMessages } from '../lib/readMessages';

Meteor.methods({
	readMessages(rid) {
		check(rid, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		const user = Meteor.user();
		const room = Rooms.findOneById(rid);
		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'readMessages' });
		}

		Promise.await(readMessages(rid, userId));
	},
});

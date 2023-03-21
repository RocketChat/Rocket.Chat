import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Subscriptions } from '@rocket.chat/models';

import { canAccessRoomId } from '../../../authorization/server';
import { Users } from '../../../models/server';

Meteor.methods({
	async 'e2e.getUsersOfRoomWithoutKey'(rid) {
		check(rid, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'e2e.getUsersOfRoomWithoutKey',
			});
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'e2e.getUsersOfRoomWithoutKey',
			});
		}

		if (!canAccessRoomId(rid, userId)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.getUsersOfRoomWithoutKey' });
		}

		const subscriptions = await Subscriptions.findByRidWithoutE2EKey(rid, {
			projection: { 'u._id': 1 },
		}).toArray();
		const userIds = subscriptions.map((s) => s.u._id);
		const options = { fields: { 'e2e.public_key': 1 } };

		const users = Users.findByIdsWithPublicE2EKey(userIds, options).fetch();

		return {
			users,
		};
	},
});

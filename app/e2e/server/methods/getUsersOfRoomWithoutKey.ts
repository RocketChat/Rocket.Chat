import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { E2E } from '../../../../server/sdk';

Meteor.methods({
	'e2e.getUsersOfRoomWithoutKey'(rid) {
		check(rid, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.getUsersOfRoomWithoutKey' });
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.getUsersOfRoomWithoutKey' });
		}

		const users = Promise.await(E2E.getRoomMembersWithoutPublicKey(uid, rid));

		return {
			users,
		};
	},
});

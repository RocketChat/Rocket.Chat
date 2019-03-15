import { Meteor } from 'meteor/meteor';
import { Subscriptions, Users } from '/app/models';

Meteor.methods({
	'e2e.getUsersOfRoomWithoutKey'(rid) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.getUsersOfRoomWithoutKey' });
		}

		const room = Meteor.call('canAccessRoom', rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.getUsersOfRoomWithoutKey' });
		}

		const subscriptions = Subscriptions.findByRidWithoutE2EKey(rid, { fields: { 'u._id': 1 } }).fetch();
		const userIds = subscriptions.map((s) => s.u._id);
		const options = { fields: { 'e2e.public_key': 1 } };

		const users = Users.findByIdsWithPublicE2EKey(userIds, options).fetch();

		return {
			users,
		};
	},
});

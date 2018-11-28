import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

Meteor.methods({
	addUsersToRoom({ rid, users } = {}) { /* microservice */
		const uid = Meteor.userId();
		// Validate user and room
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addUsersToRoom',
			});
		}

		if (!Match.test(rid, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'addUsersToRoom',
			});
		}

		return RocketChat.Services.call('core.addUsersToRoom', { uid, rid, users });
	},
});

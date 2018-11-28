import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	blockUser({ rid, blocked }) { /* microservice */

		check(rid, String);
		check(blocked, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		return RocketChat.Services.call('core.blockUser', { uid, blocked, rid });
	},
});

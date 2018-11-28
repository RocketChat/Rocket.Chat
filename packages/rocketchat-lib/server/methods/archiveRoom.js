import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
	archiveRoom(rid) { /* microservice */
		check(rid, String);
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		return RocketChat.Services.call('core.archiveRoom', { uid, rid });
	},
});

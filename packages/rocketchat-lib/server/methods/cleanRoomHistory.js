/* globals FileUpload */
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

Meteor.methods({ /* microservice */
	cleanRoomHistory({ roomId, latest, oldest, inclusive = true, limit, excludePinned = false, filesOnly = false, fromUsers = [] }) {
		check(roomId, String);
		check(latest, Date);
		check(oldest, Date);
		check(inclusive, Boolean);
		check(limit, Match.Maybe(Number));
		check(excludePinned, Match.Maybe(Boolean));
		check(filesOnly, Match.Maybe(Boolean));
		check(fromUsers, Match.Maybe([String]));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanRoomHistory' });
		}

		return RocketChat.Services.call('core.cleanRoomHistory', { uid, rid: roomId, latest, oldest, inclusive, limit, excludePinned, filesOnly, fromUsers });
	},
});

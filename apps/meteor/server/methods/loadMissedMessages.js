import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoomId } from '../../app/authorization/server';
import { Messages } from '../../app/models/server';
import { settings } from '../../app/settings/server';

Meteor.methods({
	loadMissedMessages(rid, start) {
		check(rid, String);
		check(start, Date);

		const fromId = Meteor.userId();

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (!canAccessRoomId(rid, fromId)) {
			return false;
		}

		const options = {
			sort: {
				ts: -1,
			},
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			options.fields = {
				editedAt: 0,
			};
		}

		return Messages.findVisibleByRoomIdAfterTimestamp(rid, start, options).fetch();
	},
});

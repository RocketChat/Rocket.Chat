import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoomId } from '../../app/authorization/server';
import { Messages } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';

Meteor.methods({
	loadNextMessages(rid, end, limit = 20) {
		check(rid, String);
		check(limit, Number);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadNextMessages',
			});
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'loadNextMessages' });
		}

		const fromId = Meteor.userId();

		if (!canAccessRoomId(rid, fromId)) {
			return false;
		}

		const options = {
			sort: {
				ts: 1,
			},
			limit,
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			options.fields = {
				editedAt: 0,
			};
		}

		let records;
		if (end) {
			records = Messages.findVisibleByRoomIdAfterTimestamp(rid, end, options).fetch();
		} else {
			records = Messages.findVisibleByRoomId(rid, options).fetch();
		}

		return {
			messages: normalizeMessagesForUser(records, fromId),
		};
	},
});

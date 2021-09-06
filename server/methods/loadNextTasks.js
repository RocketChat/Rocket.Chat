import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Tasks } from '../../app/models';
import { settings } from '../../app/settings';
import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';

Meteor.methods({
	loadNextTasks(rid, end, limit = 20) {
		check(rid, String);
		check(limit, Number);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadNextTasks',
			});
		}

		const fromId = Meteor.userId();

		if (!Meteor.call('canAccessRoom', rid, fromId)) {
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
			records = Tasks.findVisibleByRoomIdAfterTimestamp(rid, end, options).fetch();
		} else {
			records = Tasks.findVisibleByRoomId(rid, options).fetch();
		}

		return {
			tasks: normalizeMessagesForUser(records, fromId),
		};
	},
});

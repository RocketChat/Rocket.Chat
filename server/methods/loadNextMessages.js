import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Messages } from '../../app/models';
import { settings } from '../../app/settings';
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
			records = Messages.findVisibleByRoomIdAfterTimestamp(rid, end, options).fetch();
		} else {
			records = Messages.findVisibleByRoomId(rid, options).fetch();
		}

		return {
			messages: normalizeMessagesForUser(records, fromId),
		};
	},
});

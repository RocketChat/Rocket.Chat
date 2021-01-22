import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Message } from '../sdk';
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

		const queryOptions = {
			returnTotal: false,
			sort: {
				ts: 1,
			},
			limit,
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			queryOptions.fields = {
				editedAt: 0,
			};
		}

		const { records } = Promise.await(Message.get(fromId, { rid, oldest: end, queryOptions }));

		return {
			messages: normalizeMessagesForUser(records, fromId),
		};
	},
});

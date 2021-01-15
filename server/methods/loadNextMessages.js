import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages, Rooms, Subscriptions } from '../../app/models';
import { Message } from '../../server/sdk';
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

		const room = Rooms.findOne(rid, { fields: { hideHistoryForNewMembers: 1 } });

		let oldest;
		if (room.hideHistoryForNewMembers) {
			const sub = Subscriptions.findOneByRoomIdAndUserId(rid, fromId);

			if (end) {
				oldest = Math.max(sub.ts, end);
			}
		}

		const records = Promise.await(Messages.get(fromId, { rid, oldest, queryOptions }));

		return {
			messages: normalizeMessagesForUser(records, fromId),
		};
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import _ from 'underscore';

import { hasPermission } from '../../../authorization';
import { Subscriptions, Messages } from '../../../models';
import { settings } from '../../../settings';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { Message } from '../../../../server/sdk';

Meteor.methods({
	getChannelHistory({ rid, latest, oldest, inclusive, offset = 0, count = 20, unreads }) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getChannelHistory' });
		}

		const fromUserId = Meteor.userId();
		const room = Meteor.call('canAccessRoom', rid, fromUserId);
		if (!room) {
			return false;
		}

		// Make sure they can access the room
		if (room.t === 'c' && !hasPermission(fromUserId, 'preview-c-room') && !Subscriptions.findOneByRoomIdAndUserId(rid, fromUserId, { fields: { _id: 1 } })) {
			return false;
		}

		// Verify oldest is a date if it exists
		if ((oldest && !_.isDate(oldest)) || (latest && !_.isDate(latest))) {
			throw new Meteor.Error('error-invalid-date', 'Invalid date', { method: 'getChannelHistory' });
		}

		const queryOptions = {
			returnTotal: false,
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			queryOptions.fields = { editedAt: 0 };
		}

		const { records } = Promise.await(Message.get(fromUserId, { rid, latest, oldest, inclusive, queryOptions }));

		const messages = normalizeMessagesForUser(records, fromUserId);

		if (unreads) {
			let unreadNotLoaded = 0;
			let firstUnread = undefined;

			if (oldest) {
				const firstMsg = messages[messages.length - 1];
				if (firstMsg && firstMsg.ts > oldest) {
					const { records: unreadMessages, total } = Promise.await(Messages.get(fromUserId, {
						rid,
						oldest,
						latest: firstMsg.ts,
						queryOptions: { limit: 1, sort: { ts: 1 } },
					}));
					firstUnread = unreadMessages[0];
					unreadNotLoaded = total;
				}
			}

			return {
				messages: messages || [],
				firstUnread,
				unreadNotLoaded,
			};
		}

		return {
			messages: messages || [],
		};
	},
});

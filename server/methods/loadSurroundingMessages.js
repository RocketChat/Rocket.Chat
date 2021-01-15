import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages, Subscriptions } from '../../app/models';
import { Message } from '../../server/sdk';
import { settings } from '../../app/settings';
import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';

Meteor.methods({
	loadSurroundingMessages(message, limit = 50) {
		check(message, Object);
		check(limit, Number);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadSurroundingMessages',
			});
		}

		const fromId = Meteor.userId();

		if (!message._id) {
			return false;
		}

		// TODO apply logic for history visibility
		message = Messages.findOneById(message._id);

		if (!message || !message.rid) {
			return false;
		}

		if (!Meteor.call('canAccessRoom', message.rid, fromId)) {
			return false;
		}

		limit -= 1;

		const queryOptions = {
			sort: {
				ts: -1,
			},
			limit: Math.ceil(limit / 2),
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			queryOptions.fields = {
				editedAt: 0,
			};
		}

		let oldest;
		if (room.hideHistoryForNewMembers) {
			const sub = Subscriptions.findOneByRoomIdAndUserId(rid, userId);
			oldest = sub.ts;
		}

		const messages = Promise.await(Message.get(fromId, { rid: message.rid, latest: message.ts, oldest, queryOptions }));

		const moreBefore = messages.length === queryOptions.limit;

		messages.push(message);

		queryOptions.sort = {
			ts: 1,
		};

		queryOptions.limit = Math.floor(limit / 2);
		const afterMessages = Promise.await(Message.get(fromId, { rid: message.rid, oldest: Math.max(message.ts, oldest), queryOptions }));

		const moreAfter = afterMessages.length === queryOptions.limit;

		messages.push(...afterMessages);

		return {
			messages: normalizeMessagesForUser(messages, fromId),
			moreBefore,
			moreAfter,
		};
	},
});

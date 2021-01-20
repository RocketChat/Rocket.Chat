import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Message } from '../sdk';

Meteor.methods({
	'messages/get'(rid, { lastUpdate, latestDate = new Date(), oldestDate, inclusive = false, count = 20, unreads = false }) {
		check(rid, String);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'messages/get',
			});
		}

		if (!Meteor.call('canAccessRoom', rid, fromId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'messages/get',
			});
		}

		const queryOptions = {
			sort: {
				ts: -1,
			},
		};

		if (lastUpdate instanceof Date) {
			return {
				updated: Promise.await(Message.getUpdates({ rid, userId: fromId, timestamp: lastUpdate, queryOptions })),
				deleted: Promise.await(Message.getDeleted({ rid, userId: fromId, timestamp: lastUpdate, queryOptions: { ...queryOptions, fields: { _id: 1, _deletedAt: 1 } } })),
			};
		}

		return Meteor.call('getChannelHistory', { rid, latest: latestDate, oldest: oldestDate, inclusive, count, unreads });
	},
});

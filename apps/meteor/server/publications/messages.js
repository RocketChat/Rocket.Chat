import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { canAccessRoomId } from '../../app/authorization/server';
import { Messages } from '../../app/models/server';

Meteor.methods({
	'messages/get'(rid, { lastUpdate, latestDate = new Date(), oldestDate, inclusive = false, count = 20, unreads = false }) {
		check(rid, String);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'messages/get',
			});
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'messages/get' });
		}

		if (!canAccessRoomId(rid, fromId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'messages/get',
			});
		}

		const options = {
			sort: {
				ts: -1,
			},
		};

		if (lastUpdate instanceof Date) {
			return {
				updated: Messages.findForUpdates(rid, lastUpdate, options).fetch(),
				deleted: Messages.trashFindDeletedAfter(lastUpdate, { rid }, { ...options, fields: { _id: 1, _deletedAt: 1 } }).fetch(),
			};
		}

		return Meteor.call('getChannelHistory', {
			rid,
			latest: latestDate,
			oldest: oldestDate,
			inclusive,
			count,
			unreads,
		});
	},
});

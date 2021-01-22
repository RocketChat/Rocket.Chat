import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms, Subscriptions } from '../../app/models';
import { Message } from '../sdk';
import { settings } from '../../app/settings';

Meteor.methods({
	loadMissedMessages(rid, start) {
		check(rid, String);
		check(start, Date);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadMissedMessages',
			});
		}

		const fromId = Meteor.userId();
		if (!Meteor.call('canAccessRoom', rid, fromId)) {
			return false;
		}

		const queryOptions = {
			sort: {
				ts: -1,
			},
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
			oldest = sub.ts;
		}
		const { records } = Promise.await(Message.get(fromId, { rid, oldest, queryOptions }));

		return records;
	},
});

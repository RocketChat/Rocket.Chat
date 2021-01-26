import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

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
			returnTotal: false,
			sort: {
				ts: -1,
			},
		};

		if (!settings.get('Message_ShowEditedStatus')) {
			queryOptions.fields = {
				editedAt: 0,
			};
		}

		const { records } = Promise.await(Message.get(fromId, { rid, queryOptions }));

		return records;
	},
});

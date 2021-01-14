import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages } from '../../app/models';
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

		// TODO apply logic for history visibility
		return Messages.findVisibleByRoomIdAfterTimestamp({ rid, oldest: start, queryOptions }).fetch();
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../../../app/authorization';
import CannedResponse from '../../../models/server/models/CannedResponse';
import notifications from '../../../../../app/notifications/server/lib/Notifications';

Meteor.methods({
	removeCannedResponse(_id) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'remove-canned-responses')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeCannedResponse',
			});
		}

		check(_id, String);

		const cannedResponse = CannedResponse.findOneById(_id);
		if (!cannedResponse) {
			throw new Meteor.Error('error-canned-response-not-found', 'Canned Response not found', {
				method: 'removeCannedResponse',
			});
		}

		notifications.streamCannedResponses.emit('canned-responses', { type: 'removed', _id });

		return CannedResponse.removeById(_id);
	},
});

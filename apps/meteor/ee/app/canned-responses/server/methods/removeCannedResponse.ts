import { CannedResponse } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import notifications from '../../../../../app/notifications/server/lib/Notifications';
import { hasPermissionAsync } from '../../../../../server/lib/authorization/hasPermission';

export const removeCannedResponse = async (uid: string, _id: string): Promise<void> => {
	if (!(await hasPermissionAsync(uid, 'remove-canned-responses'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'removeCannedResponse',
		});
	}

	check(_id, String);

	const cannedResponse = await CannedResponse.findOneById(_id);
	if (!cannedResponse) {
		throw new Meteor.Error('error-canned-response-not-found', 'Canned Response not found', {
			method: 'removeCannedResponse',
		});
	}

	notifications.streamCannedResponses.emit('canned-responses', { type: 'removed', _id });

	await CannedResponse.removeById(_id);
};

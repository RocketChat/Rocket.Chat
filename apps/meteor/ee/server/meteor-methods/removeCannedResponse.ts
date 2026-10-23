import { ClientSafeError } from '@rocket.chat/core-services';
import { CannedResponse } from '@rocket.chat/models';
import { check } from 'meteor/check';

import { hasPermissionAsync } from '../../../server/lib/authorization/hasPermission';
import notifications from '../../../server/lib/notifications/core/lib/Notifications';

export const removeCannedResponse = async (uid: string, _id: string): Promise<void> => {
	if (!(await hasPermissionAsync(uid, 'remove-canned-responses'))) {
		throw new ClientSafeError('error-not-allowed', 'Not allowed', {
			method: 'removeCannedResponse',
		});
	}

	check(_id, String);

	const cannedResponse = await CannedResponse.findOneById(_id);
	if (!cannedResponse) {
		throw new ClientSafeError('error-canned-response-not-found', 'Canned Response not found', {
			method: 'removeCannedResponse',
		});
	}

	notifications.streamCannedResponses.emit('canned-responses', { type: 'removed', _id });

	await CannedResponse.removeById(_id);
};

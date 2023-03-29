import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import CannedResponse from '../../../models/server/models/CannedResponse';
import notifications from '../../../../../app/notifications/server/lib/Notifications';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeCannedResponse(_id: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async removeCannedResponse(_id) {
		const uid = Meteor.userId();

		if (!uid || !(await hasPermissionAsync(uid, 'remove-canned-responses'))) {
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

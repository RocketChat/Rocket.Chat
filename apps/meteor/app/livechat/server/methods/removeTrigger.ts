import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatTrigger } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeTrigger'(triggerId: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:removeTrigger'(triggerId) {
		methodDeprecationLogger.method('livechat:removeTrigger', '7.0.0');

		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeTrigger',
			});
		}

		check(triggerId, String);

		await LivechatTrigger.removeById(triggerId);

		return true;
	},
});

import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/Livechat';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeManager'(username: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:removeManager'(username) {
		methodDeprecationLogger.method('livechat:removeManager', '7.0.0');

		const uid = Meteor.userId();

		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-managers'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeManager',
			});
		}

		return Livechat.removeManager(username);
	},
});

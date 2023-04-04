import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:addManager'(username: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:addManager'(username) {
		const uid = Meteor.userId();
		methodDeprecationLogger.warn('livechat:addManager will be deprecated in future versions of Rocket.Chat');
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-managers'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addManager' });
		}

		return Livechat.addManager(username);
	},
});

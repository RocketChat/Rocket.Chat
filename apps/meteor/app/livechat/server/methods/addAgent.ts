import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/LivechatTyped';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:addAgent'(username: string): Promise<false | IUser>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:addAgent'(username) {
		const uid = Meteor.userId();
		methodDeprecationLogger.method('livechat:addAgent', '7.0.0');
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-agents'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		return Livechat.addAgent(username);
	},
});

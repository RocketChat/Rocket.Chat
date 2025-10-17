import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../../../app/lib/server/lib/deprecationWarningLogger';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:addMonitor'(username: string): boolean | Pick<IUser, '_id' | 'username' | 'roles'>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:addMonitor'(username) {
		methodDeprecationLogger.method('livechat:addMonitor', '8.0.0', '/v1/livechat/monitors');
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-monitors'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addMonitor' });
		}

		check(username, String);
		return LivechatEnterprise.addMonitor(username);
	},
});

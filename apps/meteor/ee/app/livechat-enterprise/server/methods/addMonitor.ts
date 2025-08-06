import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';

import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:addMonitor'(username: string): boolean | Pick<IUser, '_id' | 'username' | 'roles'>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:addMonitor'(username) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-monitors'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addMonitor' });
		}

		check(username, String);
		return LivechatEnterprise.addMonitor(username);
	},
});

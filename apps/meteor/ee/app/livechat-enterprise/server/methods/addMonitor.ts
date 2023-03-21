import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization/server';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:addMonitor'(username: string): boolean | IUser;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:addMonitor'(username) {
		const uid = Meteor.userId();
		if (!uid || !hasPermission(uid, 'manage-livechat-monitors')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addMonitor' });
		}

		return LivechatEnterprise.addMonitor(username);
	},
});

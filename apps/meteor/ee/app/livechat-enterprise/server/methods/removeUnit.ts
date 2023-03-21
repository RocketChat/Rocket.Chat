import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization/server';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeUnit'(id: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:removeUnit'(id) {
		const uid = Meteor.userId();
		if (!uid || !hasPermission(uid, 'manage-livechat-units')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeUnit' });
		}

		return LivechatEnterprise.removeUnit(id);
	},
});

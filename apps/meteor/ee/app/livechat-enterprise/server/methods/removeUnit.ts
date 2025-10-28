import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../../../app/lib/server/lib/deprecationWarningLogger';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeUnit'(id: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:removeUnit'(id) {
		methodDeprecationLogger.method('livechat:removeUnit', '8.0.0', 'DELETE /v1/livechat/units/:id');
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-units'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeUnit' });
		}

		check(id, String);
		return (await LivechatEnterprise.removeUnit(id, uid)).deletedCount > 0;
	},
});

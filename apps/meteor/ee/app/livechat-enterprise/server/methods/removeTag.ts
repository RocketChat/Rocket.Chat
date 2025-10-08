import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../../../app/lib/server/lib/deprecationWarningLogger';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeTag'(id: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:removeTag'(id) {
		methodDeprecationLogger.method('livechat:removeTag', '8.0.0', '/v1/livechat/tags.delete');
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-tags'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeTag' });
		}

		check(id, String);
		return (await LivechatEnterprise.removeTag(id)).deletedCount > 0;
	},
});

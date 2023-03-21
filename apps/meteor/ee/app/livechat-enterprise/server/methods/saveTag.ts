import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization/server';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveTag'(id: string, tagData: any, tagDepartments: any): boolean;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:saveTag'(_id, tagData, tagDepartments) {
		const uid = Meteor.userId();
		if (!uid || !hasPermission(uid, 'manage-livechat-tags')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveTags' });
		}

		return LivechatEnterprise.saveTag(_id, tagData, tagDepartments);
	},
});

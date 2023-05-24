import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveTag'(id: string, tagData: any, tagDepartments: any): Promise<ILivechatTag>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveTag'(_id, tagData, tagDepartments) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-tags'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveTags' });
		}

		return LivechatEnterprise.saveTag(_id, tagData, tagDepartments);
	},
});

import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveUnit'(_id: string, unitData: any, unitMonitors: any, unitDepartments: any): Omit<IOmnichannelBusinessUnit, '_updatedAt'>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveUnit'(_id, unitData, unitMonitors, unitDepartments) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-units'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveUnit' });
		}

		return LivechatEnterprise.saveUnit(_id, unitData, unitMonitors, unitDepartments);
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { DeleteResult } from 'mongodb';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { DepartmentHelper } from '../lib/Departments';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeDepartment'(_id: string): DeleteResult;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:removeDepartment'(_id) {
		methodDeprecationLogger.warn('livechat:removeDepartment will be deprecated in future versions of Rocket.Chat');

		check(_id, String);

		const uid = Meteor.userId();

		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-departments'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeDepartment',
			});
		}

		return DepartmentHelper.removeDepartment(_id);
	},
});

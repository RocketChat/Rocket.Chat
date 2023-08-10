import { api } from '@rocket.chat/core-services';
import { CustomUserStatus } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteCustomUserStatus(userStatusID: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteCustomUserStatus(userStatusID) {
		if (!this.userId || !(await hasPermissionAsync(this.userId, 'manage-user-status'))) {
			throw new Meteor.Error('not_authorized');
		}

		const userStatus = await CustomUserStatus.findOneById(userStatusID);
		if (userStatus == null) {
			throw new Meteor.Error('Custom_User_Status_Error_Invalid_User_Status', 'Invalid user status', { method: 'deleteCustomUserStatus' });
		}

		await CustomUserStatus.removeById(userStatusID);
		void api.broadcast('user.deleteCustomStatus', userStatus);

		return true;
	},
});

import { License } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Permissions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { notifyOnPermissionChangedById } from '../../../lib/server/lib/notifyListener';
import { CONSTANTS, AuthorizationUtils } from '../../lib';
import { hasPermissionAsync } from '../functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'authorization:addPermissionToRole'(permissionId: string, role: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'authorization:addPermissionToRole'(permissionId, role) {
		if (role === 'guest' && !AuthorizationUtils.hasRestrictionsToRole(role) && (await License.hasValidLicense())) {
			AuthorizationUtils.addRolePermissionWhiteList(role, await License.getGuestPermissions());
		}

		if (AuthorizationUtils.isPermissionRestrictedForRole(permissionId, role)) {
			throw new Meteor.Error('error-action-not-allowed', 'Permission is restricted', {
				method: 'authorization:addPermissionToRole',
				action: 'Adding_permission',
			});
		}

		const uid = Meteor.userId();
		const permission = await Permissions.findOneById(permissionId);

		if (!permission) {
			throw new Meteor.Error('error-invalid-permission', 'Permission does not exist', {
				method: 'authorization:addPermissionToRole',
				action: 'Adding_permission',
			});
		}

		if (
			!uid ||
			!(await hasPermissionAsync(uid, 'access-permissions')) ||
			(permission.level === CONSTANTS.SETTINGS_LEVEL && !(await hasPermissionAsync(uid, 'access-setting-permissions')))
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
				method: 'authorization:addPermissionToRole',
				action: 'Adding_permission',
			});
		}

		// for setting-based-permissions, authorize the group access as well
		if (permission.groupPermissionId) {
			await Permissions.addRole(permission.groupPermissionId, role);
			void notifyOnPermissionChangedById(permission.groupPermissionId);
		}

		await Permissions.addRole(permission._id, role);

		void notifyOnPermissionChangedById(permission._id);
	},
});

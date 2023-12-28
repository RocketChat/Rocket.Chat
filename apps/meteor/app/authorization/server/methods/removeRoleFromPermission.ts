import { Permissions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { CONSTANTS } from '../../lib';
import { hasPermissionAsync } from '../functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'authorization:removeRoleFromPermission'(permissionId: string, role: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'authorization:removeRoleFromPermission'(permissionId, role) {
		const uid = Meteor.userId();
		const permission = await Permissions.findOneById(permissionId);

		if (!permission) {
			throw new Meteor.Error('error-permission-not-found', 'Permission not found', {
				method: 'authorization:removeRoleFromPermission',
			});
		}

		if (
			!uid ||
			!(await hasPermissionAsync(uid, 'access-permissions')) ||
			(permission.level === CONSTANTS.SETTINGS_LEVEL && !(await hasPermissionAsync(uid, 'access-setting-permissions')))
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Removing permission is not allowed', {
				method: 'authorization:removeRoleFromPermission',
				action: 'Removing_permission',
			});
		}

		// for setting based permissions, revoke the group permission once all setting permissions
		// related to this group have been removed

		if (permission.groupPermissionId) {
			await Permissions.removeRole(permission.groupPermissionId, role);
		}
		await Permissions.removeRole(permission._id, role);
	},
});

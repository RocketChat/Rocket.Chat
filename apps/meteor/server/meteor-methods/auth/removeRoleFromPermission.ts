import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { removeRoleFromPermissionMethod } from '../../lib/authorization/permissionRole';
import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'authorization:removeRoleFromPermission'(permissionId: string, role: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'authorization:removeRoleFromPermission'(permissionId, role) {
		methodDeprecationLogger.method('authorization:removeRoleFromPermission', '9.0.0', '/v1/permissions.removeRole');
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'authorization:removeRoleFromPermission' });
		}
		await removeRoleFromPermissionMethod(uid, permissionId, role);
	},
});

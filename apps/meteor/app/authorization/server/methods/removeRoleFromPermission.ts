import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { removeRoleFromPermissionMethod } from '../functions/permissionRole';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'authorization:removeRoleFromPermission'(permissionId: string, role: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'authorization:removeRoleFromPermission'(permissionId, role) {
		methodDeprecationLogger.method('authorization:removeRoleFromPermission', '9.0.0', '/v1/permissions.removeRole');
		await removeRoleFromPermissionMethod(Meteor.userId(), permissionId, role);
	},
});

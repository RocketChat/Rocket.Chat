import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { addPermissionToRoleMethod } from '../functions/permissionRole';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'authorization:addPermissionToRole'(permissionId: string, role: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'authorization:addPermissionToRole'(permissionId, role) {
		methodDeprecationLogger.method('authorization:addPermissionToRole', '9.0.0', '/v1/permissions.addRole');
		await addPermissionToRoleMethod(Meteor.userId(), permissionId, role);
	},
});

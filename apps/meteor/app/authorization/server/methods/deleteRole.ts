import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { DeleteResult } from 'mongodb';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { hasPermissionAsync } from '../functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'authorization:deleteRole'(roleId: IRole['_id'] | IRole['name']): Promise<DeleteResult>;
	}
}

Meteor.methods<ServerMethods>({
	async 'authorization:deleteRole'(roleId) {
		const userId = Meteor.userId();

		if (!userId || !(await hasPermissionAsync(userId, 'access-permissions'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:deleteRole',
				action: 'Accessing_permissions',
			});
		}

		const options = {
			projection: {
				_id: 1,
				protected: 1,
			},
		};

		let role = await Roles.findOneById<Pick<IRole, '_id' | 'protected'>>(roleId, options);
		if (!role) {
			role = await Roles.findOneByName<Pick<IRole, '_id' | 'protected'>>(roleId, options);

			if (!role) {
				throw new Meteor.Error('error-invalid-role', 'Invalid role', {
					method: 'authorization:deleteRole',
				});
			}

			methodDeprecationLogger.deprecatedParameterUsage(
				'authorization:deleteRole',
				'role',
				'7.0.0',
				({ parameter, method, version }) => `Calling ${method} with ${parameter} names is deprecated and will be removed ${version}`,
			);
		}

		if (role.protected) {
			throw new Meteor.Error('error-delete-protected-role', 'Cannot delete a protected role', {
				method: 'authorization:deleteRole',
			});
		}

		const users = await (await Roles.findUsersInRole(role._id)).count();

		if (users > 0) {
			throw new Meteor.Error('error-role-in-use', "Cannot delete role because it's in use", {
				method: 'authorization:deleteRole',
			});
		}

		return Roles.removeById(role._id);
	},
});

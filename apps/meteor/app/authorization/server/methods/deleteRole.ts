import { Meteor } from 'meteor/meteor';
import type { IRole } from '@rocket.chat/core-typings';

import { Roles } from '../../../models/server/raw';
import { hasPermission } from '../functions/hasPermission';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'authorization:deleteRole'(roleId) {
		const userId = Meteor.userId();

		if (!userId || !hasPermission(userId, 'access-permissions')) {
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

			apiDeprecationLogger.warn(`Calling authorization:deleteRole with role names will be deprecated in future versions of Rocket.Chat`);
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

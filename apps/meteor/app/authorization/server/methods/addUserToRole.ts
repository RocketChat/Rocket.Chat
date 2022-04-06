import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import type { IRole, IUser, IRoom } from '@rocket.chat/core-typings';

import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { hasPermission } from '../functions/hasPermission';
import { api } from '../../../../server/sdk/api';
import { Roles } from '../../../models/server/raw';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'authorization:addUserToRole'(roleId: IRole['_id'], username: IUser['username'], scope: IRoom['_id'] | undefined) {
		const userId = Meteor.userId();

		if (!userId || !hasPermission(userId, 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:addUserToRole',
				action: 'Accessing_permissions',
			});
		}

		if (!roleId || !_.isString(roleId) || !username || !_.isString(username)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'authorization:addUserToRole',
			});
		}

		let role = await Roles.findOneById<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });
		if (!role) {
			role = await Roles.findOneByName<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });

			if (!role) {
				throw new Meteor.Error('error-invalid-role', 'Invalid Role', {
					method: 'authorization:addUserToRole',
				});
			}

			apiDeprecationLogger.warn(`Calling authorization:addUserToRole with role names will be deprecated in future versions of Rocket.Chat`);
		}

		if (role._id === 'admin' && !hasPermission(userId, 'assign-admin-role')) {
			throw new Meteor.Error('error-action-not-allowed', 'Assigning admin is not allowed', {
				method: 'authorization:addUserToRole',
				action: 'Assign_admin',
			});
		}

		const user = Users.findOneByUsernameIgnoringCase(username, {
			fields: {
				_id: 1,
			},
		});

		if (!user || !user._id) {
			throw new Meteor.Error('error-user-not-found', 'User not found', {
				method: 'authorization:addUserToRole',
			});
		}

		// verify if user can be added to given scope
		if (scope && !(await Roles.canAddUserToRole(user._id, role._id, scope))) {
			throw new Meteor.Error('error-invalid-user', 'User is not part of given room', {
				method: 'authorization:addUserToRole',
			});
		}

		const add = await Roles.addUserRoles(user._id, [role._id], scope);

		if (settings.get('UI_DisplayRoles')) {
			api.broadcast('user.roleUpdate', {
				type: 'added',
				_id: role._id,
				u: {
					_id: user._id,
					username,
				},
				scope,
			});
		}

		return add;
	},
});

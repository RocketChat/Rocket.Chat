import { Roles } from '@rocket.chat/models';
import { isRoleCreateProps, isRoleUpdateProps } from '@rocket.chat/rest-typings';

import { API } from '../../../app/api/server/api';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { settings } from '../../../app/settings/server/index';
import { insertRole } from '../../../server/lib/roles/insertRole';
import { updateRole } from '../../../server/lib/roles/updateRole';
import { isEnterprise } from '../../app/license/server';

API.v1.addRoute(
	'roles.create',
	{ authRequired: true },
	{
		async post() {
			if (!isEnterprise()) {
				throw new Meteor.Error('error-action-not-allowed', 'This is an enterprise feature');
			}

			if (!isRoleCreateProps(this.bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.');
			}

			const userId = Meteor.userId();

			if (!userId || !(await hasPermissionAsync(userId, 'access-permissions'))) {
				throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed');
			}

			const { name, scope, description, mandatory2fa } = this.bodyParams;

			if (await Roles.findOneByIdOrName(name)) {
				throw new Meteor.Error('error-duplicate-role-names-not-allowed', 'Role name already exists');
			}

			const roleData = {
				description: description || '',
				...(mandatory2fa !== undefined && { mandatory2fa }),
				name,
				scope: scope || 'Users',
				protected: false,
			};

			const options = {
				broadcastUpdate: settings.get<boolean>('UI_DisplayRoles'),
			};

			const role = insertRole(roleData, options);

			return API.v1.success({
				role,
			});
		},
	},
);

API.v1.addRoute(
	'roles.update',
	{ authRequired: true },
	{
		async post() {
			if (!isRoleUpdateProps(this.bodyParams)) {
				throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.');
			}

			if (!(await hasPermissionAsync(this.userId, 'access-permissions'))) {
				throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed');
			}

			const { roleId, name, scope, description, mandatory2fa } = this.bodyParams;

			const role = await Roles.findOne(roleId);

			if (!isEnterprise() && !role?.protected) {
				throw new Meteor.Error('error-action-not-allowed', 'This is an enterprise feature');
			}

			const roleData = {
				description: description || '',
				...(mandatory2fa !== undefined && { mandatory2fa }),
				name,
				scope: scope || 'Users',
				protected: false,
			};

			const options = {
				broadcastUpdate: settings.get<boolean>('UI_DisplayRoles'),
			};

			const updatedRole = updateRole(roleId, roleData, options);

			return API.v1.success({
				role: updatedRole,
			});
		},
	},
);

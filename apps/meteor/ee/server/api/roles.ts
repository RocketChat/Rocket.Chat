import type { IRole } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Roles } from '@rocket.chat/models';
import Ajv from 'ajv';

import { API } from '../../../app/api/server/api';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { settings } from '../../../app/settings/server/index';
import { insertRoleAsync } from '../lib/roles/insertRole';
import { updateRole } from '../lib/roles/updateRole';

const ajv = new Ajv({
	coerceTypes: true,
});

type RoleCreateProps = Pick<IRole, 'name'> & Partial<Pick<IRole, 'description' | 'scope' | 'mandatory2fa'>>;

const roleCreatePropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		description: {
			type: 'string',
			nullable: true,
		},
		scope: {
			type: 'string',
			enum: ['Users', 'Subscriptions'],
			nullable: true,
		},
		mandatory2fa: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isRoleCreateProps = ajv.compile<RoleCreateProps>(roleCreatePropsSchema);

type RoleUpdateProps = {
	roleId: IRole['_id'];
	name: IRole['name'];
} & Partial<RoleCreateProps>;

const roleUpdatePropsSchema = {
	type: 'object',
	properties: {
		roleId: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		description: {
			type: 'string',
			nullable: true,
		},
		scope: {
			type: 'string',
			enum: ['Users', 'Subscriptions'],
			nullable: true,
		},
		mandatory2fa: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['roleId', 'name'],
	additionalProperties: false,
};

export const isRoleUpdateProps = ajv.compile<RoleUpdateProps>(roleUpdatePropsSchema);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/roles.create': {
			POST: (params: RoleCreateProps) => {
				role: IRole;
			};
		};
		'/v1/roles.update': {
			POST: (role: RoleUpdateProps) => {
				role: IRole;
			};
		};
	}
}

API.v1.addRoute(
	'roles.create',
	{ authRequired: true, license: ['custom-roles'] },
	{
		async post() {
			if (!License.hasModule('custom-roles')) {
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

			const role = await insertRoleAsync(roleData, options);

			return API.v1.success({ role });
		},
	},
);

API.v1.addRoute(
	'roles.update',
	{ authRequired: true, license: ['custom-roles'] },
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

			if (!License.hasModule('custom-roles') && !role?.protected) {
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

			const updatedRole = await updateRole(roleId, roleData, options);

			return API.v1.success({ role: updatedRole });
		},
	},
);

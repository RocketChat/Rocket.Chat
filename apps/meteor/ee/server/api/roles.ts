import type { IRole } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Roles } from '@rocket.chat/models';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { API } from '../../../server/api/api';
import { hasPermissionAsync } from '../../../server/lib/authorization/hasPermission';
import { settings } from '../../../server/settings';
import { insertRoleAsync } from '../lib/roles/insertRole';
import { updateRole } from '../lib/roles/updateRole';

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

const roleResponseSchema = ajv.compile<{ role: IRole }>({
	type: 'object',
	properties: {
		role: { $ref: '#/components/schemas/IRole' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['role', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'roles.create',
	{
		authRequired: true,
		license: ['custom-roles'],
		body: isRoleCreateProps,
		response: {
			200: roleResponseSchema,
			401: validateUnauthorizedErrorResponse,
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
		if (!License.hasModule('custom-roles')) {
			throw new Meteor.Error('error-action-not-allowed', 'This is an enterprise feature');
		}

		const { userId } = this;

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
);

API.v1.post(
	'roles.update',
	{
		authRequired: true,
		// No route-level `license` gate: the license middleware would reject before the handler,
		// but updating a protected role is allowed without custom-roles (handled in-action below).
		body: isRoleUpdateProps,
		response: {
			200: roleResponseSchema,
			401: validateUnauthorizedErrorResponse,
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
		if (!(await hasPermissionAsync(this.user, 'access-permissions'))) {
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
);

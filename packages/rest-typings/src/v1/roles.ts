import type { IRole } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';

type RoleDeleteProps = { roleId: IRole['_id'] };

const roleDeletePropsSchema = {
	type: 'object',
	properties: {
		roleId: {
			type: 'string',
		},
	},
	required: ['roleId'],
	additionalProperties: false,
};

export const isRoleDeleteProps = ajv.compile<RoleDeleteProps>(roleDeletePropsSchema);

type RoleAddUserToRoleProps = {
	username: string;
	roleId: string;
	roomId?: string;
};

const roleAddUserToRolePropsSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
		roleId: {
			type: 'string',
		},
		roomId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['username'],
	additionalProperties: false,
};

export const isRoleAddUserToRoleProps = ajv.compile<RoleAddUserToRoleProps>(roleAddUserToRolePropsSchema);

type RoleRemoveUserFromRoleProps = {
	username: string;
	roleId: string;
	roomId?: string;
	scope?: string;
};

const roleRemoveUserFromRolePropsSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
		roleId: {
			type: 'string',
		},
		roomId: {
			type: 'string',
			nullable: true,
		},
		scope: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['username'],
	additionalProperties: false,
};

export const isRoleRemoveUserFromRoleProps = ajv.compile<RoleRemoveUserFromRoleProps>(roleRemoveUserFromRolePropsSchema);

type RolesGetUsersInRoleProps = PaginatedRequest<{
	roomId?: string;
	role: string;
}>;

const RolesGetUsersInRolePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: true,
		},
		role: {
			type: 'string',
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['role'],
	additionalProperties: false,
};

export const isRolesGetUsersInRoleProps = ajvQuery.compile<RolesGetUsersInRoleProps>(RolesGetUsersInRolePropsSchema);

// All /v1/roles.* routes are typed by their migrated implementations
// (apps/meteor/server/api/v1/roles.ts) via ExtractRoutesFromAPI.
export type RolesEndpoints = {};

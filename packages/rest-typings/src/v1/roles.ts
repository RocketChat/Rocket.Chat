import Ajv from 'ajv';
import type { RocketChatRecordDeleted, IRole, IUserInRole } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';

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
	// #ToDo: Make it non-optional on the next major release
	roleId?: string;
	roleName?: string;
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
			nullable: true,
		},
		roleName: {
			type: 'string',
			nullable: true,
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
	// #ToDo: Make it non-optional on the next major release
	roleId?: string;
	roleName?: string;
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
			nullable: true,
		},
		roleName: {
			type: 'string',
			nullable: true,
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

export const isRolesGetUsersInRoleProps = ajv.compile<RolesGetUsersInRoleProps>(RolesGetUsersInRolePropsSchema);

type RoleSyncProps = {
	updatedSince?: string;
};

export type RolesEndpoints = {
	'/v1/roles.list': {
		GET: () => {
			roles: IRole[];
		};
	};
	'/v1/roles.sync': {
		GET: (params: RoleSyncProps) => {
			roles: {
				update: IRole[];
				remove: RocketChatRecordDeleted<IRole>[];
			};
		};
	};
	'/v1/roles.create': {
		POST: (params: RoleCreateProps) => {
			role: IRole;
		};
	};

	'/v1/roles.addUserToRole': {
		POST: (params: RoleAddUserToRoleProps) => {
			role: IRole;
		};
	};

	'/v1/roles.getUsersInRole': {
		GET: (params: RolesGetUsersInRoleProps) => {
			users: IUserInRole[];
			total: number;
		};
	};

	'/v1/roles.update': {
		POST: (role: RoleUpdateProps) => {
			role: IRole;
		};
	};

	'/v1/roles.delete': {
		POST: (prop: RoleDeleteProps) => void;
	};

	'/v1/roles.removeUserFromRole': {
		POST: (props: RoleRemoveUserFromRoleProps) => {
			role: IRole;
		};
	};
};

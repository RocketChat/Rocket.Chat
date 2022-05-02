import Ajv, { JSONSchemaType } from 'ajv';
import type { RocketChatRecordDeleted, IRole, IUserInRole } from '@rocket.chat/core-typings';

const ajv = new Ajv();

type RoleCreateProps = Pick<IRole, 'name'> & Partial<Pick<IRole, 'description' | 'scope' | 'mandatory2fa'>>;

const roleCreatePropsSchema: JSONSchemaType<RoleCreateProps> = {
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

export const isRoleCreateProps = ajv.compile(roleCreatePropsSchema);

type RoleUpdateProps = {
	roleId: IRole['_id'];
	name: IRole['name'];
} & Partial<RoleCreateProps>;

const roleUpdatePropsSchema: JSONSchemaType<RoleUpdateProps> = {
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

export const isRoleUpdateProps = ajv.compile(roleUpdatePropsSchema);

type RoleDeleteProps = { roleId: IRole['_id'] };

const roleDeletePropsSchema: JSONSchemaType<RoleDeleteProps> = {
	type: 'object',
	properties: {
		roleId: {
			type: 'string',
		},
	},
	required: ['roleId'],
	additionalProperties: false,
};

export const isRoleDeleteProps = ajv.compile(roleDeletePropsSchema);

type RoleAddUserToRoleProps = {
	username: string;
	// #ToDo: Make it non-optional on the next major release
	roleId?: string;
	roleName?: string;
	roomId?: string;
};

const roleAddUserToRolePropsSchema: JSONSchemaType<RoleAddUserToRoleProps> = {
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

export const isRoleAddUserToRoleProps = ajv.compile(roleAddUserToRolePropsSchema);

type RoleRemoveUserFromRoleProps = {
	username: string;
	// #ToDo: Make it non-optional on the next major release
	roleId?: string;
	roleName?: string;
	roomId?: string;
	scope?: string;
};

const roleRemoveUserFromRolePropsSchema: JSONSchemaType<RoleRemoveUserFromRoleProps> = {
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

export const isRoleRemoveUserFromRoleProps = ajv.compile(roleRemoveUserFromRolePropsSchema);

type RoleSyncProps = {
	updatedSince?: string;
};

export type RolesEndpoints = {
	'roles.list': {
		GET: () => {
			roles: IRole[];
		};
	};
	'roles.sync': {
		GET: (params: RoleSyncProps) => {
			roles: {
				update: IRole[];
				remove: RocketChatRecordDeleted<IRole>[];
			};
		};
	};
	'roles.create': {
		POST: (params: RoleCreateProps) => {
			role: IRole;
		};
	};

	'roles.addUserToRole': {
		POST: (params: RoleAddUserToRoleProps) => {
			role: IRole;
		};
	};

	'roles.getUsersInRole': {
		GET: (params: { roomId?: string; role: string; offset?: number; count?: number }) => {
			users: IUserInRole[];
			total: number;
		};
	};

	'roles.update': {
		POST: (role: RoleUpdateProps) => {
			role: IRole;
		};
	};

	'roles.delete': {
		POST: (prop: RoleDeleteProps) => void;
	};

	'roles.removeUserFromRole': {
		POST: (props: RoleRemoveUserFromRoleProps) => {
			role: IRole;
		};
	};
};

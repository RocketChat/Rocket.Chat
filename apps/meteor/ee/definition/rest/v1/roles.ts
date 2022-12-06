import type { IRole } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

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

import type { IPermission } from '@rocket.chat/core-typings';

import { ajv } from '../helpers/schemas';

type PermissionsListAllProps = {
	updatedSince?: string;
};

const permissionListAllSchema = {
	type: 'object',
	properties: {
		updatedSince: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isPermissionsListAll = ajv.compile<PermissionsListAllProps>(permissionListAllSchema);

type PermissionsUpdateProps = {
	permissions: { _id: string; roles: string[] }[];
};

const permissionUpdatePropsSchema = {
	type: 'object',
	properties: {
		permissions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					roles: {
						type: 'array',
						items: { type: 'string' },
						uniqueItems: true,
					},
				},
				additionalProperties: false,
				required: ['_id', 'roles'],
			},
		},
	},
	required: ['permissions'],
	additionalProperties: false,
};

export const isBodyParamsValidPermissionUpdate = ajv.compile<PermissionsUpdateProps>(permissionUpdatePropsSchema);

export type PermissionsEndpoints = {
	'/v1/permissions.listAll': {
		GET: (params: PermissionsListAllProps) => {
			update: IPermission[];
			remove: IPermission[];
		};
	};
	'/v1/permissions.update': {
		POST: (params: PermissionsUpdateProps) => {
			permissions: IPermission[];
		};
	};
};

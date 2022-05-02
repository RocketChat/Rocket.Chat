import Ajv, { JSONSchemaType } from 'ajv';
import type { IPermission } from '@rocket.chat/core-typings';

const ajv = new Ajv();

type PermissionsUpdateProps = {
	permissions: { _id: string; roles: string[] }[];
};

const permissionUpdatePropsSchema: JSONSchemaType<PermissionsUpdateProps> = {
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

export const isBodyParamsValidPermissionUpdate = ajv.compile(permissionUpdatePropsSchema);

export type PermissionsEndpoints = {
	'permissions.listAll': {
		GET: (params: { updatedSince?: string }) => {
			update: IPermission[];
			remove: IPermission[];
		};
	};
	'permissions.update': {
		POST: (params: PermissionsUpdateProps) => {
			permissions: IPermission[];
		};
	};
};

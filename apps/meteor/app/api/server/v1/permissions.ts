import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions, Roles } from '@rocket.chat/models';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { permissionsGetMethod } from '../../../authorization/server/streamer/permissions';
import { notifyOnPermissionChangedById } from '../../../lib/server/lib/notifyListener';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

type PermissionsListAllProps = {
	updatedSince?: string;
};

type PermissionsUpdateProps = {
	permissions: { _id: string; roles: string[] }[];
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

const isPermissionsListAll = ajv.compile<PermissionsListAllProps>(permissionListAllSchema);

const isBodyParamsValidPermissionUpdate = ajv.compile<PermissionsUpdateProps>(permissionUpdatePropsSchema);

const permissionsEndpoints = API.v1
	.get(
		'permissions.listAll',
		{
			authRequired: true,
			query: isPermissionsListAll,
			response: {
				200: ajv.compile<{
					update: IPermission[];
					remove: IPermission[];
				}>({
					type: 'object',
					properties: {
						update: {
							type: 'array',
							items: { $ref: '#/components/schemas/IPermission' },
						},
						remove: {
							type: 'array',
							items: { $ref: '#/components/schemas/IPermission' },
						},
						success: {
							type: 'boolean',
							enum: [true],
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['update', 'remove', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { updatedSince } = this.queryParams;

			let updatedSinceDate: Date | undefined;
			if (updatedSince) {
				if (isNaN(Date.parse(updatedSince))) {
					throw new Meteor.Error('error-roomId-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
				}
				updatedSinceDate = new Date(updatedSince);
			}

			const result = (await permissionsGetMethod(updatedSinceDate)) as {
				update: IPermission[];
				remove: IPermission[];
			};

			if (Array.isArray(result)) {
				return API.v1.success({
					update: result,
					remove: [],
				});
			}

			return API.v1.success(result);
		},
	)
	.post(
		'permissions.update',
		{
			authRequired: true,
			permissionsRequired: ['access-permissions'],
			body: isBodyParamsValidPermissionUpdate,
			response: {
				200: ajv.compile<{
					permissions: IPermission[];
				}>({
					type: 'object',
					properties: {
						permissions: {
							type: 'array',
							items: { $ref: '#/components/schemas/IPermission' },
						},
						success: {
							type: 'boolean',
							enum: [true],
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['permissions', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { bodyParams } = this;

			if (!isBodyParamsValidPermissionUpdate(bodyParams)) {
				return API.v1.failure('Invalid body params', 'error-invalid-body-params');
			}

			const permissionKeys = bodyParams.permissions.map(({ _id }) => _id);
			const permissions = await Permissions.find({ _id: { $in: permissionKeys } }).toArray();

			if (permissions.length !== bodyParams.permissions.length) {
				return API.v1.failure('Invalid permission', 'error-invalid-permission');
			}

			const roleKeys = [...new Set(bodyParams.permissions.flatMap((p) => p.roles))];

			const roles = await Roles.find({ _id: { $in: roleKeys } }).toArray();

			if (roles.length !== roleKeys.length) {
				return API.v1.failure('Invalid role', 'error-invalid-role');
			}

			for await (const permission of bodyParams.permissions) {
				await Permissions.setRoles(permission._id, permission.roles);
				void notifyOnPermissionChangedById(permission._id);
			}

			const result = (await permissionsGetMethod()) as IPermission[];

			return API.v1.success({
				permissions: result,
			});
		},
	);

export type PermissionsEndpoints = ExtractRoutesFromAPI<typeof permissionsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends PermissionsEndpoints {}
}

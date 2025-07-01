import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions, Roles } from '@rocket.chat/models';
import { isBodyParamsValidPermissionUpdate } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';
import { Meteor } from 'meteor/meteor';

import { permissionsGetMethod } from '../../../authorization/server/streamer/permissions';
import { notifyOnPermissionChangedById } from '../../../lib/server/lib/notifyListener';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

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

const permissionsListAllEndpoints = API.v1.get(
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
						items: {
							type: 'object',
							properties: {
								_id: { type: 'string' },
								_updatedAt: { type: 'object' },
								roles: {
									type: 'array',
									items: { type: 'string' },
								},
								group: { type: 'string', nullable: true },
								groupPermissionId: { type: 'string', nullable: true },
								level: { type: 'string', enum: ['settings'], nullable: true },
								section: { type: 'string', nullable: true },
								sectionPermissionId: { type: 'string', nullable: true },
								settingId: { type: 'string', nullable: true },
								sorter: { type: 'integer', nullable: true },
							},
							required: ['_id', '_updatedAt', 'roles'],
							additionalProperties: false,
						},
					},
					remove: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								_id: { type: 'string' },
								_updatedAt: { type: 'object' },
								roles: {
									type: 'array',
									items: { type: 'string' },
								},
								group: { type: 'string', nullable: true },
								groupPermissionId: { type: 'string', nullable: true },
								level: { type: 'string', enum: ['settings'], nullable: true },
								section: { type: 'string', nullable: true },
								sectionPermissionId: { type: 'string', nullable: true },
								settingId: { type: 'string', nullable: true },
								sorter: { type: 'integer', nullable: true },
							},
							required: ['_id', '_updatedAt', 'roles'],
							additionalProperties: false,
						},
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['update', 'remove', 'success'],
				additionalProperties: false,
			}),
			400: ajv.compile({
				type: 'object',
				properties: {
					error: {
						type: 'string',
						description: 'The error message.',
					},
					errorType: {
						type: 'string',
						description: 'The type of the error.',
					},
					details: {
						type: 'object',
						nullable: true,
						properties: {
							rid: {
								type: 'string',
								description: 'The room ID.',
							},
							method: {
								type: 'string',
								description: 'The method that caused the error.',
							},
						},
					},
					success: {
						type: 'boolean',
						enum: [false],
					},
				},
				required: ['success', 'error'],
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [false],
					},
					status: {
						type: 'string',
					},
					message: {
						type: 'string',
					},
				},
				required: ['success'],
			}),
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
);

API.v1.post(
	'permissions.update',
	{
		authRequired: true,
		permissionsRequired: ['access-permissions'],
		body: isBodyParamsValidPermissionUpdate,
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					permissions: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								_id: { type: 'string' },
								_updatedAt: { type: 'object' },
								roles: {
									type: 'array',
									items: { type: 'string' },
								},
								group: { type: 'string', nullable: true },
								groupPermissionId: { type: 'string', nullable: true },
								level: { type: 'string', enum: ['settings'], nullable: true },
								section: { type: 'string', nullable: true },
								sectionPermissionId: { type: 'string', nullable: true },
								settingId: { type: 'string', nullable: true },
								sorter: { type: 'integer', nullable: true },
							},
							required: ['_id', '_updatedAt', 'roles'],
							additionalProperties: false,
						},
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['permissions', 'success'],
				additionalProperties: false,
			}),
			// TODO: add 400 error response
			400: ajv.compile({
				type: 'object',
				properties: {
					errorType: {
						type: 'string',
						description: 'The type of the error.',
					},
					success: {
						type: 'boolean',
						enum: [false],
					},
				},
				required: ['success', 'errorType'],
			}),
			// TODO: add 401 error response
			401: ajv.compile({
				type: 'object',
				properties: {
					name: {
						type: 'string',
						description: 'The error message.',
					},
					errorType: {
						type: 'string',
						description: 'The type of the error.',
					},
					success: {
						type: 'boolean',
						enum: [false],
					},
				},
				required: ['success', 'name', 'errorType'],
			}),
			// TODO: add 403 error response
			403: ajv.compile({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [false],
					},
				},
				required: ['success'],
			}),
		},
	},
	async function () {
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

type PermissionsListAllEndpoints = ExtractRoutesFromAPI<typeof permissionsListAllEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends PermissionsListAllEndpoints {}
}

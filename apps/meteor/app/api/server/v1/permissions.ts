import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions, Roles } from '@rocket.chat/models';
import {
	UnauthorizedErrorResponseSchema,
	ForbiddenErrorResponseSchema,
	BadRequestErrorResponseSchema,
	GETPermissionsListAllQuerySchema,
	GETPermissionsListAllResponseSchema,
	POSTPermissionsUpdateBodySchema,
	POSTPermissionsUpdateResponseSchema,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { permissionsGetMethod } from '../../../authorization/server/streamer/permissions';
import { notifyOnPermissionChangedById } from '../../../lib/server/lib/notifyListener';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const permissionsEndpoints = API.v1
	.get(
		'permissions.listAll',
		{
			authRequired: true,
			query: GETPermissionsListAllQuerySchema,
			response: {
				200: GETPermissionsListAllResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
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
			body: POSTPermissionsUpdateBodySchema,
			response: {
				200: POSTPermissionsUpdateResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
				403: ForbiddenErrorResponseSchema,
			},
		},
		async function action() {
			const { bodyParams } = this;

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

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ExtractRoutesFromAPI<typeof permissionsEndpoints> {}
}

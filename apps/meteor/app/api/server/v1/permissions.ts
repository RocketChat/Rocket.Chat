import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions, Roles } from '@rocket.chat/models';
import { isBodyParamsValidPermissionUpdate } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { permissionsGetMethod } from '../../../authorization/server/streamer/permissions';
import { notifyOnPermissionChangedById } from '../../../lib/server/lib/notifyListener';
import { API } from '../api';

API.v1.addRoute(
	'permissions.listAll',
	{ authRequired: true },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'permissions.update',
	{ authRequired: true, permissionsRequired: ['access-permissions'] },
	{
		async post() {
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
	},
);

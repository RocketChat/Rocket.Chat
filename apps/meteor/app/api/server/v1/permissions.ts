import { Meteor } from 'meteor/meteor';
import type { IPermission } from '@rocket.chat/core-typings';
import { isBodyParamsValidPermissionUpdate } from '@rocket.chat/rest-typings';

import { hasPermission } from '../../../authorization/server';
import { API } from '../api';
import { Permissions, Roles } from '../../../models/server/raw';

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

			const result = (await Meteor.call('permissions/get', updatedSinceDate)) as {
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
	{ authRequired: true },
	{
		async post() {
			if (!hasPermission(this.userId, 'access-permissions')) {
				return API.v1.failure('Editing permissions is not allowed', 'error-edit-permissions-not-allowed');
			}

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
			}

			const result = (await Meteor.call('permissions/get')) as IPermission[];

			return API.v1.success({
				permissions: result,
			});
		},
	},
);

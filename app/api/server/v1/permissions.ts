import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { API } from '../api';
import { Permissions, Roles } from '../../../models/server/raw';

API.v1.addRoute('permissions.listAll', { authRequired: true }, {
	get() {
		const { updatedSince } = this.queryParams;

		let updatedSinceDate: Date | undefined;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-roomId-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			}
			updatedSinceDate = new Date(updatedSince);
		}

		const result = Promise.await(Meteor.call('permissions/get', updatedSinceDate));

		if (Array.isArray(result)) {
			return API.v1.success({
				update: result,
				remove: [],
			});
		}

		return API.v1.success(result);
	},
});

API.v1.addRoute('permissions.update', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'access-permissions')) {
			return API.v1.failure('Editing permissions is not allowed', 'error-edit-permissions-not-allowed');
		}

		check(this.bodyParams, {
			permissions: [
				Match.ObjectIncluding({
					_id: String,
					roles: [String],
				}),
			],
		});

		let permissionNotFound = false;
		let roleNotFound = false;
		Object.keys(this.bodyParams.permissions).forEach((key) => {
			const element = this.bodyParams.permissions[key];

			if (!Promise.await(Permissions.findOneById(element._id))) {
				permissionNotFound = true;
			}

			Object.keys(element.roles).forEach((key) => {
				const subElement = element.roles[key];

				if (!Promise.await(Roles.findOneById(subElement))) {
					roleNotFound = true;
				}
			});
		});

		if (permissionNotFound) {
			return API.v1.failure('Invalid permission', 'error-invalid-permission');
		} if (roleNotFound) {
			return API.v1.failure('Invalid role', 'error-invalid-role');
		}

		Object.keys(this.bodyParams.permissions).forEach((key) => {
			const element = this.bodyParams.permissions[key];

			Permissions.createOrUpdate(element._id, element.roles);
		});

		const result = Promise.await(Meteor.call('permissions/get'));

		return API.v1.success({
			permissions: result,
		});
	},
});

/**
	This API returns all permissions that exists
	on the server, with respective roles.

	Method: GET
	Route: api/v1/permissions
 */
RocketChat.API.v1.addRoute('permissions', { authRequired: true }, {
	get() {
		const warningMessage = 'The endpoint "permissions" is deprecated and will be removed after version v0.69';
		console.warn(warningMessage);

		const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));

		return RocketChat.API.v1.success(result);
	}
});

RocketChat.API.v1.addRoute('permissions.list', { authRequired: true }, {
	get() {
		const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));

		return RocketChat.API.v1.success({
			permissions: result
		});
	}
});

RocketChat.API.v1.addRoute('permissions.update', { authRequired: true }, {
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'access-permissions')) {
			return RocketChat.API.v1.failure('Editing permissions is not allowed', 'error-edit-permissions-not-allowed');
		}

		check(this.bodyParams, {
			permissions: [
				Match.ObjectIncluding({
					_id: String,
					roles: [String]
				})
			]
		});

		let permissionNotFound = false;
		let roleNotFound = false;
		Object.keys(this.bodyParams.permissions).forEach((key) => {
			const element = this.bodyParams.permissions[key];

			if (!RocketChat.models.Permissions.findOneById(element._id)) {
				permissionNotFound = true;
			}

			Object.keys(element.roles).forEach((key) => {
				const subelement = element.roles[key];

				if (!RocketChat.models.Roles.findOneById(subelement)) {
					roleNotFound = true;
				}
			});
		});

		if (permissionNotFound) {
			return RocketChat.API.v1.failure('Invalid permission', 'error-invalid-permission');
		} else if (roleNotFound) {
			return RocketChat.API.v1.failure('Invalid role', 'error-invalid-role');
		}

		Object.keys(this.bodyParams.permissions).forEach((key) => {
			const element = this.bodyParams.permissions[key];

			RocketChat.models.Permissions.createOrUpdate(element._id, element.roles);
		});

		const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));

		return RocketChat.API.v1.success({
			permissions: result
		});
	}
});

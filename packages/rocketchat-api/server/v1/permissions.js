/**
	This API returns logged user permissions.

	Method: GET
	Route: api/v1/permissions
 */
RocketChat.API.v1.addRoute('permissions', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () =>
			result = Meteor.call('permissions/get')
		);

		return RocketChat.API.v1.success(result);
	}
});

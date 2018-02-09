/**
	This API returns all permissions that exists
	on the server, with respective roles.

	Method: GET
	Route: api/v1/permissions
 */
RocketChat.API.v1.addRoute('permissions', { authRequired: true }, {
	get() {
		const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));

		return RocketChat.API.v1.success(result);
	}
});

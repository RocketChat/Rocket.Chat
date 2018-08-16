RocketChat.API.v1.addRoute('roles.list', { authRequired: true }, {
	get() {
		const roles = RocketChat.models.Roles.find({}, { fields: { _updatedAt: 0 } }).fetch();

		return RocketChat.API.v1.success({ roles });
	},
});

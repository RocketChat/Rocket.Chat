RocketChat.models.Roles = new Mongo.Collection('rocketchat_roles');

Object.assign(RocketChat.models.Roles, {
	findUsersInRole(name, scope, options) {
		const role = this.findOne(name);
		const roleScope = (role && role.scope) || 'Users';
		const model = RocketChat.models[roleScope];
		return model && model.findUsersInRoles && model.findUsersInRoles(name, scope, options);
	},

	isUserInRoles(userId, roles, scope) {
		roles = [].concat(roles);
		return roles.some((roleName) => {
			const role = this.findOne(roleName);
			const roleScope = (role && role.scope) || 'Users';
			const model = RocketChat.models[roleScope];
			return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
		});
	}
});

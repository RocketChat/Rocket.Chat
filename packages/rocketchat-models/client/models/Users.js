const Users = {};

Object.assign(Users, {
	isUserInRole(userId, roleName) {
		const query = {
			_id: userId,
		};

		const user = this.findOne(query);
		return user && Array.isArray(user.roles) && user.roles.includes(roleName);
	},

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	},
});

export { Users };

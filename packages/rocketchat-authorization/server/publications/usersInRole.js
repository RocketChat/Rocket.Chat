Meteor.publish('usersInRole', function(roleName, scope, limit = 50) {
	if (!this.userId) {
		return this.ready();
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'access-permissions')) {
		return this.error(new Meteor.Error('error-not-allowed', 'Not allowed', {
			publish: 'usersInRole'
		}));
	}

	const options = {
		limit,
		sort: {
			name: 1
		}
	};

	return RocketChat.authz.getUsersInRole(roleName, scope, options);
});

import _ from 'underscore';

Meteor.methods({
	getUserRoles() {

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUserRoles' });
		}

		const options = {
			sort: {
				'username': 1
			},
			fields: {
				username: 1,
				roles: 1
			}
		};

		const roles = RocketChat.models.Roles.find({ scope: 'Users', description: { $exists: 1, $ne: '' } }).fetch();
		const roleIds = _.pluck(roles, '_id');

		// Security issue: we should not send all user's roles to all clients, only the 'public' roles
		// We must remove all roles that are not part of the query from the returned users
		const users = RocketChat.models.Users.findUsersInRoles(roleIds, null, options).fetch();
		for (const user of users) {
			user.roles = _.intersection(user.roles, roleIds);
		}
		return users;
	}
});

import _ from 'underscore';

RocketChat.authz.addUserRoles = function(userId, roleNames, scope) {
	if (!userId || !roleNames) {
		return false;
	}

	const user = RocketChat.models.Users.db.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.addUserRoles'
		});
	}

	roleNames = [].concat(roleNames);
	const existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id');
	const invalidRoleNames = _.difference(roleNames, existingRoleNames);

	if (!_.isEmpty(invalidRoleNames)) {
		for (const role of invalidRoleNames) {
			RocketChat.models.Roles.createOrUpdate(role);
		}
	}

	RocketChat.models.Roles.addUserRoles(userId, roleNames, scope);

	return true;
};

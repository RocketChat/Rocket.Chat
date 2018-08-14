import _ from 'underscore';

RocketChat.authz.removeUserFromRoles = function(userId, roleNames, scope) {
	if (!userId || !roleNames) {
		return false;
	}

	const user = RocketChat.models.Users.findOneById(userId);

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.removeUserFromRoles'
		});
	}

	roleNames = [].concat(roleNames);
	const existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id');
	const invalidRoleNames = _.difference(roleNames, existingRoleNames);

	if (!_.isEmpty(invalidRoleNames)) {
		throw new Meteor.Error('error-invalid-role', 'Invalid role', {
			function: 'RocketChat.authz.removeUserFromRoles'
		});
	}

	RocketChat.models.Roles.removeUserRoles(userId, roleNames, scope);

	return true;
};

import { Meteor } from 'meteor/meteor';
import { Users, Roles } from '/app/models';
import { getRoles } from './getRoles';
import _ from 'underscore';

export const removeUserFromRoles = (userId, roleNames, scope) => {
	if (!userId || !roleNames) {
		return false;
	}

	const user = Users.findOneById(userId);

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.removeUserFromRoles',
		});
	}

	roleNames = [].concat(roleNames);
	const existingRoleNames = _.pluck(getRoles(), '_id');
	const invalidRoleNames = _.difference(roleNames, existingRoleNames);

	if (!_.isEmpty(invalidRoleNames)) {
		throw new Meteor.Error('error-invalid-role', 'Invalid role', {
			function: 'RocketChat.authz.removeUserFromRoles',
		});
	}

	Roles.removeUserRoles(userId, roleNames, scope);

	return true;
};

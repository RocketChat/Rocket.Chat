import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { getRoles } from './getRoles';
import { Users, Roles } from '../../../models';

export const addUserRoles = (userId, roleNames, scope) => {
	if (!userId || !roleNames) {
		return false;
	}

	const user = Users.db.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.addUserRoles',
		});
	}

	roleNames = [].concat(roleNames);
	const existingRoleNames = _.pluck(getRoles(), '_id');
	const invalidRoleNames = _.difference(roleNames, existingRoleNames);

	if (!_.isEmpty(invalidRoleNames)) {
		for (const role of invalidRoleNames) {
			Roles.createOrUpdate(role);
		}
	}

	Roles.addUserRoles(userId, roleNames, scope);

	return true;
};

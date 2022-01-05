import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { getRoles } from './getRoles';
import { Users } from '../../../models/server';
import { IRole, IUser } from '../../../../definition/IUser';
import { Roles } from '../../../models/server/raw';

export const addUserRoles = (userId: IUser['_id'], roleNames: IRole['name'][], scope?: string): boolean => {
	if (!userId || !roleNames) {
		return false;
	}

	const user = Users.db.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.addUserRoles',
		});
	}

	if (!Array.isArray(roleNames)) {
		// TODO: remove this check
		roleNames = [roleNames];
	}

	const existingRoleNames = _.pluck(getRoles(), '_id');
	const invalidRoleNames = _.difference(roleNames, existingRoleNames);

	if (!_.isEmpty(invalidRoleNames)) {
		for (const role of invalidRoleNames) {
			Promise.await(Roles.createOrUpdate(role));
		}
	}

	Promise.await(Roles.addUserRoles(userId, roleNames, scope));
	return true;
};

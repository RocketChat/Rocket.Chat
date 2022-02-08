import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { getRoles } from './getRoles';
import { IRole, IUser } from '../../../../definition/IUser';
import { Users, Roles } from '../../../models/server/raw';

export const addUserRolesAsync = async (userId: IUser['_id'], roleNames: IRole['name'][], scope?: string): Promise<boolean> => {
	if (!userId || !roleNames) {
		return false;
	}

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.addUserRoles',
		});
	}

	const existingRoleNames = _.pluck(getRoles(), '_id');
	const invalidRoleNames = _.difference(roleNames, existingRoleNames);

	if (!_.isEmpty(invalidRoleNames)) {
		for await (const role of invalidRoleNames) {
			await Roles.createOrUpdate(role);
		}
	}

	return Roles.addUserRoles(userId, roleNames, scope);
};

export const addUserRoles = (userId: IUser['_id'], roleNames: IRole['name'][], scope?: string): boolean =>
	Promise.await(addUserRolesAsync(userId, roleNames, scope));

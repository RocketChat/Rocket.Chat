import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { getRoles } from './getRoles';
import { IRole, IUser } from '../../../../definition/IUser';
import { Users, Roles } from '../../../models/server/raw';
import { ensureArray } from '../../../../lib/utils/arrayUtils';

export const removeUserFromRolesAsync = async (
	userId: IUser['_id'],
	roleNames: IRole['name'] | Array<IRole['name']>,
	scope?: string,
): Promise<boolean> => {
	if (!userId || !roleNames) {
		return false;
	}

	const user = await Users.findOneById(userId);

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.removeUserFromRoles',
		});
	}

	roleNames = ensureArray(roleNames);

	const existingRoleNames = _.pluck(getRoles(), '_id');
	const invalidRoleNames = _.difference(roleNames, existingRoleNames);

	if (!_.isEmpty(invalidRoleNames)) {
		throw new Meteor.Error('error-invalid-role', 'Invalid role', {
			function: 'RocketChat.authz.removeUserFromRoles',
		});
	}

	return Roles.removeUserRoles(userId, roleNames, scope);
};

export const removeUserFromRoles = (userId: IUser['_id'], roleNames: IRole['name'] | Array<IRole['name']>, scope?: string): boolean =>
	Promise.await(removeUserFromRolesAsync(userId, roleNames, scope));

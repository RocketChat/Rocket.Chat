import _ from 'underscore';

import type { IRole, IUser } from '../../../definition/IUser';
import type { IRoom } from '../../../definition/IRoom';
import { Users, Roles } from '../../../app/models/server/raw';
import { DetailedError } from '../../../lib/utils/DetailedError';
import { insertRole } from './insertRole';

export const addUserRolesByNameAsync = async (userId: IUser['_id'], roleNames: IRole['name'][], scope?: IRoom['_id']): Promise<boolean> => {
	if (!userId || !roleNames?.length) {
		return false;
	}

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new DetailedError('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.addUserRoles',
		});
	}

	if (!Array.isArray(roleNames)) {
		// TODO: remove this check
		roleNames = [roleNames];
	}

	const options = {
		projection: {
			name: 1,
		},
	};

	const existingRoles = await Roles.findByNames<Pick<IRole, '_id' | 'name'>>(roleNames, options).toArray();
	const existingRoleNames = _.pluck(existingRoles, 'name');
	const invalidRoleNames = _.difference(roleNames, existingRoleNames);

	for (const role of invalidRoleNames) {
		if (!role) {
			continue;
		}

		insertRole({
			name: role,
			description: '',
			protected: false,
			scope: 'Users',
		});
	}

	await Roles.addUserRoles(userId, roleNames, scope);
	return true;
};

export const addUserRolesByName = (...args: Parameters<typeof addUserRolesByNameAsync>): boolean => Promise.await(addUserRolesByNameAsync(...args));

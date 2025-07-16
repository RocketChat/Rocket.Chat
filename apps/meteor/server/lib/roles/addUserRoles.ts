import { MeteorError } from '@rocket.chat/core-services';
import type { IRole, IUser, IRoom } from '@rocket.chat/core-typings';
import { Roles, Subscriptions, Users } from '@rocket.chat/models';

import { syncRoomRolePriorityForUserAndRoom } from './syncRoomRolePriority';
import { validateRoleList } from './validateRoleList';
import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../../app/lib/server/lib/notifyListener';

export const addUserRolesAsync = async (userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean> => {
	if (!userId || !roles?.length) {
		return false;
	}

	if (!(await validateRoleList(roles))) {
		throw new MeteorError('error-invalid-role', 'Invalid role');
	}

	if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
		throw new Error('Roles.addUserRoles method received a role scope instead of a scope value.');
	}

	if (!Array.isArray(roles)) {
		roles = [roles];
		process.env.NODE_ENV === 'development' && console.warn('[WARN] RolesRaw.addUserRoles: roles should be an array');
	}

	for await (const roleId of roles) {
		const role = await Roles.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });

		if (!role) {
			process.env.NODE_ENV === 'development' && console.warn(`[WARN] RolesRaw.addUserRoles: role: ${roleId} not found`);
			continue;
		}

		if (role.scope === 'Subscriptions' && scope) {
			const addRolesResponse = await Subscriptions.addRolesByUserId(userId, [role._id], scope);
			await syncRoomRolePriorityForUserAndRoom(userId, scope);
			if (addRolesResponse.modifiedCount) {
				void notifyOnSubscriptionChangedByRoomIdAndUserId(scope, userId);
			}
		} else {
			await Users.addRolesByUserId(userId, [role._id]);
		}
	}

	return true;
};

import { MeteorError } from '@rocket.chat/core-services';
import type { IRole, IUser, IRoom } from '@rocket.chat/core-typings';
import { Users, Subscriptions, Roles } from '@rocket.chat/models';

import { syncRoomRolePriorityForUserAndRoom } from './syncRoomRolePriority';
import { validateRoleList } from './validateRoleList';
import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../../app/lib/server/lib/notifyListener';

export const removeUserFromRolesAsync = async (userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean> => {
	if (!userId || !roles) {
		return false;
	}

	const user = await Users.findOneById(userId, { projection: { _id: 1 } });
	if (!user) {
		throw new MeteorError('error-invalid-user', 'Invalid user');
	}

	if (!(await validateRoleList(roles))) {
		throw new MeteorError('error-invalid-role', 'Invalid role');
	}

	if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
		throw new Error('Roles.removeUserRoles method received a role scope instead of a scope value.');
	}

	for await (const roleId of roles) {
		const role = await Roles.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });
		if (!role) {
			continue;
		}

		if (role.scope === 'Subscriptions' && scope) {
			const removeRolesResponse = await Subscriptions.removeRolesByUserId(userId, [roleId], scope);
			await syncRoomRolePriorityForUserAndRoom(userId, scope);
			if (removeRolesResponse.modifiedCount) {
				void notifyOnSubscriptionChangedByRoomIdAndUserId(scope, userId);
			}
		} else {
			await Users.removeRolesByUserId(userId, [roleId]);
		}
	}

	return true;
};

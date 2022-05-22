import type { IUser, IRole, AtLeast } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import { api } from '../../../server/sdk/api';
import { addUserRolesAsync } from '../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../server/lib/roles/removeUserFromRoles';
import { Users } from '../../../app/models/server/raw';
import { canAddNewUser } from '../../app/license/server/license';

type setUserRolesOptions = {
	// If specified, the function will not add nor remove any role that is not on this list.
	allowedRoles?: Array<IRole['_id']>;
	// If set to true, roles will only be added, not removed
	skipRemovingRoles?: boolean;
	// the scope value (eg: room id) to assign the roles to
	scope?: string;
};

function filterRoleList(
	roleList: Array<IRole['_id']>,
	rolesToFilterOut: Array<IRole['_id']>,
	rolesToFilterIn?: Array<IRole['_id']>,
): Array<IRole['_id']> {
	const filteredRoles = roleList.filter((roleId) => !rolesToFilterOut.includes(roleId));

	if (!rolesToFilterIn) {
		return filteredRoles;
	}

	return filteredRoles.filter((roleId) => rolesToFilterIn.includes(roleId));
}

function broadcastRoleChange(type: string, roleList: Array<IRole['_id']>, user: AtLeast<IUser, '_id' | 'username'>): void {
	if (!settings.get('UI_DisplayRoles')) {
		return;
	}

	const { _id, username } = user;

	for (const roleId of roleList) {
		api.broadcast('user.roleUpdate', {
			type,
			_id: roleId,
			u: {
				_id,
				username,
			},
		});
	}
}

export async function syncUserRoles(
	uid: IUser['_id'],
	newRoleList: Array<IRole['_id']>,
	{ allowedRoles, skipRemovingRoles, scope }: setUserRolesOptions,
): Promise<void> {
	const user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'roles'>>(uid, { projection: { username: 1, roles: 1 } });
	if (!user) {
		throw new Error('error-user-not-found');
	}

	const existingRoles = user.roles;
	const rolesToAdd = filterRoleList(newRoleList, existingRoles, allowedRoles);
	const rolesToRemove = filterRoleList(existingRoles, newRoleList, allowedRoles);

	if (!rolesToAdd.length && !rolesToRemove.length) {
		return;
	}

	const wasGuest = existingRoles.length === 1 && existingRoles[0] === 'guest';
	if (wasGuest && !canAddNewUser()) {
		throw new Error('error-license-user-limit-reached');
	}

	if (rolesToAdd.length && (await addUserRolesAsync(uid, rolesToAdd, scope))) {
		broadcastRoleChange('added', rolesToAdd, user);
	}

	if (skipRemovingRoles || !rolesToRemove.length) {
		return;
	}

	if (await removeUserFromRolesAsync(uid, rolesToRemove, scope)) {
		broadcastRoleChange('removed', rolesToRemove, user);
	}
}

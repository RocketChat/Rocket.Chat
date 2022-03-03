import type { IUser } from '../../../definition/IUser';
import type { IRole } from '../../../definition/IRole';
import { settings } from '../../../app/settings/server';
import { api } from '../../../server/sdk/api';
import { addUserRolesAsync, removeUserFromRolesAsync } from '../../../app/authorization/server';
import { Users } from '../../../app/models/server/raw';
import { canAddNewUser } from '../../app/license/server/license';

type setUserRolesOptions = {
	// If specified, the function will not add nor remove any role that is not on this list.
	allowedRoles?: Array<IRole['name']>;
	// If set to true, roles will only be added, not removed
	skipRemovingRoles?: boolean;
	// the scope value (eg: room id) to assign the roles to
	scope?: string;
};

function filterRoleList(
	roleList: Array<IRole['name']>,
	rolesToFilterOut: Array<IRole['name']>,
	rolesToFilterIn?: Array<IRole['name']>,
): Array<IRole['name']> {
	const filteredRoles = roleList.filter((roleName) => !rolesToFilterOut.includes(roleName));

	if (!rolesToFilterIn) {
		return filteredRoles;
	}

	return filteredRoles.filter((roleName) => rolesToFilterIn.includes(roleName));
}

function broadcastRoleChange(type: string, roleList: Array<IRole['name']>, user: IUser): void {
	if (!settings.get('UI_DisplayRoles')) {
		return;
	}

	const { _id, username } = user;

	for (const roleName of roleList) {
		api.broadcast('user.roleUpdate', {
			type,
			_id: roleName,
			u: {
				_id,
				username,
			},
		});
	}
}

export async function syncUserRoles(
	uid: IUser['_id'],
	newRoleList: Array<IRole['name']>,
	{ allowedRoles, skipRemovingRoles, scope }: setUserRolesOptions,
): Promise<void> {
	const user = await Users.findOneById(uid);
	if (!user) {
		throw new Error('error-user-not-found');
	}

	const existingRoles = user.roles;
	const rolesToAdd = filterRoleList(newRoleList, existingRoles, allowedRoles);
	const rolesToRemove = filterRoleList(existingRoles, newRoleList, allowedRoles);

	if (!rolesToAdd.length || !rolesToRemove.length) {
		return;
	}

	const wasGuest = existingRoles.length === 1 && existingRoles[0] === 'guest';
	if (wasGuest && !canAddNewUser()) {
		throw new Error('error-license-user-limit-reached');
	}

	if (await addUserRolesAsync(uid, rolesToAdd, scope)) {
		broadcastRoleChange('added', rolesToAdd, user);
	}

	if (skipRemovingRoles) {
		return;
	}

	if (await removeUserFromRolesAsync(uid, rolesToRemove, scope)) {
		broadcastRoleChange('removed', rolesToRemove, user);
	}
}

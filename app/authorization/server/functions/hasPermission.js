import mem from 'mem';

import { Permissions, Users, Subscriptions } from '../../../models/server/raw';

const rolesHasPermission = mem(async (permission, roles) => {
	const result = await Permissions.findOne({ _id: permission, roles: { $in: roles } });
	return !!result;
});

const getRoles = mem(async (uid, scope) => {
	const { roles: userRoles = [] } = await Users.findOne({ _id: uid });
	const { roles: subscriptionsRoles = [] } = (scope && await Subscriptions.findOne({ rid: scope, 'u._id': uid }, { fields: { roles: 1 } })) || {};
	return [...userRoles, ...subscriptionsRoles].sort((a, b) => a.localeCompare(b));
}, { maxAge: 1000 });

export const clearCache = () => {
	mem.clear(getRoles);
	mem.clear(rolesHasPermission);
};

async function atLeastOne(uid, permissions = [], scope) {
	const sortedRoles = await getRoles(uid, scope);
	for (const permission of permissions) {
		if (await rolesHasPermission(permission, sortedRoles)) { // eslint-disable-line
			return true;
		}
	}

	return false;
}

async function all(uid, permissions = [], scope) {
	const sortedRoles = await getRoles(uid, scope);
	for (const permission of permissions) {
		if (!await rolesHasPermission(permission, sortedRoles)) { // eslint-disable-line
			return false;
		}
	}

	return true;
}

function _hasPermission(userId, permissions, scope, strategy) {
	if (!userId) {
		return false;
	}
	return strategy(userId, [].concat(permissions), scope);
}

export const hasAllPermissionAsync = async (userId, permissions, scope) => _hasPermission(userId, permissions, scope, all);
export const hasPermissionAsync = async (userId, permissionId, scope) => _hasPermission(userId, permissionId, scope, all);
export const hasAtLeastOnePermissionAsync = async (userId, permissions, scope) => _hasPermission(userId, permissions, scope, atLeastOne);

export const hasAllPermission = (userId, permissions, scope) => Promise.await(hasAllPermissionAsync(userId, permissions, scope));
export const hasPermission = (userId, permissionId, scope) => Promise.await(hasPermissionAsync(userId, permissionId, scope));
export const hasAtLeastOnePermission = (userId, permissions, scope) => Promise.await(hasAtLeastOnePermissionAsync(userId, permissions, scope));

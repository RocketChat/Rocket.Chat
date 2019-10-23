import mem from 'mem';

import { Permissions, Roles, Users, Subscriptions } from '../../../models/server/raw';


const getRole = mem((role) => Roles.findOne({ _id: role }));

const rolesHasPermission = mem(async (permission, roles) => {
	const result = await Permissions.findOne({ _id: permission, roles: { $in: roles } });
	return !!result;
});

const subscriptionHasPermission = mem(async (uid, permission, roles, rid) => {
	if (rid == null) {
		return;
	}

	const query = {
		'u._id': uid,
		rid,
		roles: { $in: roles },
	};

	return !!await Subscriptions.findOne(query, { fields: { roles: 1 } });
}, { maxAge: 5000 });

export const clearCache = () => {
	mem.clear(getRole);
	mem.clear(rolesHasPermission);
	mem.clear(subscriptionHasPermission);
};

async function atLeastOne(uid, permissions = [], scope) {
	const { roles: userRoles = [] } = await Users.findOne({ _id: uid });
	const { roles: subscriptionsRoles = [] } = scope ? await Subscriptions.findOne({ rid: scope, 'u._id': uid }) : {};
	const sortedRoles = [...userRoles, ...subscriptionsRoles].sort((a, b) => a.localeCompare(b));

	for (const permission of permissions) {
		if (await rolesHasPermission(permission, sortedRoles)) { // eslint-disable-line
			return true;
		}
	}

	return false;
}

async function all(uid, permissions = [], scope) {
	const { roles: userRoles = [] } = await Users.findOne({ _id: uid });
	const { roles: subscriptionsRoles = [] } = scope ? await Subscriptions.findOne({ rid: scope, 'u._id': uid }) : {};
	const sortedRoles = [...userRoles, ...subscriptionsRoles].sort((a, b) => a.localeCompare(b));

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

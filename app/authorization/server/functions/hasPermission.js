import mem from 'mem';

import { Permissions, Roles, Users, Subscriptions } from '../../../models/server/raw';


const getRole = mem((role) => Roles.findOne({ _id: role }));

const rolesHasPermission = mem(async (permission, roles) => {
	const result = await Permissions.findOne({ _id: permission, roles: { $in: roles } });
	return !!result;
});

const exists = (item) => !!item;

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

const groupRolesByScope = async (sortedUserRoles) => (await Promise.all(sortedUserRoles.map(getRole))).filter(exists).reduce((roles, role) => {
	roles[role.scope || 'Users'] = roles[role.scope || 'Users'] ? roles[role.scope || 'Users'].concat([role._id]) : [].concat([role._id]);
	return roles;
}, {});

async function atLeastOne(uid, permissions = [], scope) {
	const { roles: userRoles } = await Users.findOne({ _id: uid });

	const sortedUserRoles = userRoles.sort((a, b) => a.localeCompare(b));

	const roles = await groupRolesByScope(sortedUserRoles);
	const keys = Object.keys(roles);
	for (let index = 0; index < keys.length; index++) {
		const key = keys[index];
		switch (key) {
			case 'Users':
				for (const permission of permissions) {
					if (await rolesHasPermission(permission, roles[key])) { // eslint-disable-line
						return true;
					}
				}
				break;
			case 'Subscriptions':
				const found = await subscriptionHasPermission(uid, roles[key], scope);// eslint-disable-line
				if (found) {
					return true;
				}
				break;
		}
	}

	return false;
}

async function all(uid, permissions = [], scope) {
	const { roles: userRoles } = await Users.findOne({ _id: uid });

	const sortedUserRoles = userRoles.sort((a, b) => a.localeCompare(b));

	const roles = await groupRolesByScope(sortedUserRoles);

	const keys = Object.keys(roles);

	for (let index = 0; index < keys.length; index++) {
		const key = keys[index];
		switch (key) {
			case 'Users':
				for (const permission of permissions) {
					if (!await rolesHasPermission(permission, roles[key])) { // eslint-disable-line
						return false;
					}
				}
				break;
			default:
			case 'Subscriptions':
				const found = await subscriptionHasPermission(uid, roles[key], scope);// eslint-disable-line
				if (!found) {
					return false;
				}
				break;
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

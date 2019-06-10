import { Permissions, Roles } from '../../../models/server/raw';

async function atLeastOne(userId, permissions = [], scope) {
	for (let i = 0, total = permissions.length; i < total; i++) {
		const permissionId = permissions[i];

		// eslint-disable-next-line no-await-in-loop
		const permission = await Permissions.findOne({ _id: permissionId });
		// eslint-disable-next-line no-await-in-loop
		const found = await Roles.isUserInRoles(userId, permission.roles, scope);
		if (found) {
			return true;
		}
	}

	return false;
}

async function all(userId, permissions = [], scope) {
	for (let i = 0, total = permissions.length; i < total; i++) {
		const permissionId = permissions[i];

		// eslint-disable-next-line no-await-in-loop
		const permission = await Permissions.findOne({ _id: permissionId });
		// eslint-disable-next-line no-await-in-loop
		const found = await Roles.isUserInRoles(userId, permission.roles, scope);
		if (!found) {
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

export const hasAllPermission = async (userId, permissions, scope) => _hasPermission(userId, permissions, scope, all);

export const hasPermission = async (userId, permissionId, scope) => _hasPermission(userId, permissionId, scope, all);

export const hasAtLeastOnePermission = async (userId, permissions, scope) => _hasPermission(userId, permissions, scope, atLeastOne);

import { Meteor } from 'meteor/meteor';

const restrictedRolePermissions = {};

export const AuthorizationUtils = class {
	static addRolePermissionWhiteList(roleId: string, list: [string]) {
		if (!roleId) {
			throw new Meteor.Error('invalid-param');
		}

		if (!list) {
			throw new Meteor.Error('invalid-param');
		}

		if (!restrictedRolePermissions[roleId]) {
			restrictedRolePermissions[roleId] = { whitelist: [] };
		}

		restrictedRolePermissions[roleId].whitelist.push(...list);
	}

	static isPermissionRestrictedForRole(permissionId: string, roleId: string) {
		if (!roleId || !permissionId) {
			throw new Meteor.Error('invalid-param');
		}

		if (!restrictedRolePermissions[roleId]) {
			return false;
		}

		const rules = restrictedRolePermissions[roleId];

		if (rules.whitelist.length) {
			return !rules.whitelist.includes(permissionId);
		}

		return false;
	}

	static isPermissionRestrictedForRoleList(permissionId: string, roleList: [string]) {
		if (!roleList || !permissionId) {
			throw new Meteor.Error('invalid-param');
		}

		for (const roleId of roleList) {
			if (this.isPermissionRestrictedForRole(permissionId, roleId)) {
				return true;
			}
		}

		return false;
	}
};

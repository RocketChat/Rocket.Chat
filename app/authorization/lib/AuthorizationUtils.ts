import { Meteor } from 'meteor/meteor';

const restrictedRolePermissions = {};

export const AuthorizationUtils = class {
	static addRestrictedRolePermission(roleId: string, permissionId: string) {
		if (!roleId || !permissionId) {
			throw new Meteor.Error('invalid-param');
		}

		if (!restrictedRolePermissions[roleId]) {
			restrictedRolePermissions[roleId] = [];
		}

		if (!restrictedRolePermissions[roleId].includes(permissionId)) {
			restrictedRolePermissions[roleId].push(permissionId);
		}
	}

	static isPermissionRestrictedForRole(permissionId: string, roleId: string) {
		if (!roleId || !permissionId) {
			throw new Meteor.Error('invalid-param');
		}

		if (!restrictedRolePermissions[roleId]) {
			return false;
		}

		return restrictedRolePermissions[roleId].includes(permissionId);
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

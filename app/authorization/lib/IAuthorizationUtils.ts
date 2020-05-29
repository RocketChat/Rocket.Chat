import { Meteor } from 'meteor/meteor';

const restrictedRolePermissions = new Map();

export interface IAuthorization {
	hasPermission(userId: string, permissionId: string, scope?: string): boolean;
	hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): boolean;
	addRolePermissionWhiteList(roleId: string, list: string[]): void;
	isPermissionRestrictedForRole(permissionId: string, roleId: string): boolean;
	isPermissionRestrictedForRoleList(permissionId: string, roleList: [string]): boolean;
}

export abstract class AbstractAuthorizationUtils {
	addRolePermissionWhiteList(roleId: string, list: string[]): void {
		if (!roleId) {
			throw new Meteor.Error('invalid-param');
		}

		if (!list) {
			throw new Meteor.Error('invalid-param');
		}

		if (!restrictedRolePermissions.has(roleId)) {
			restrictedRolePermissions.set(roleId, new Set());
		}

		const rules = restrictedRolePermissions.get(roleId);

		for (const permissionId of list) {
			rules.add(permissionId);
		}
	}

	isPermissionRestrictedForRole(permissionId: string, roleId: string): boolean {
		if (!roleId || !permissionId) {
			throw new Meteor.Error('invalid-param');
		}

		if (!restrictedRolePermissions.has(roleId)) {
			return false;
		}

		const rules = restrictedRolePermissions.get(roleId);
		if (!rules || !rules.size) {
			return false;
		}

		return !rules.has(permissionId);
	}

	isPermissionRestrictedForRoleList(permissionId: string, roleList: [string]): boolean {
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
}

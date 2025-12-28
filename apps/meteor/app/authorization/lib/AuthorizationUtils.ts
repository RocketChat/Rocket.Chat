const restrictedRolePermissions = new Map<string, Set<string>>();

export const AuthorizationUtils = class {
	static addRolePermissionWhiteList(roleId: string, list: string[]): void {
		if (!roleId) {
			throw new Error('invalid-param');
		}

		if (!list) {
			throw new Error('invalid-param');
		}

		if (!restrictedRolePermissions.has(roleId)) {
			restrictedRolePermissions.set(roleId, new Set());
		}

		const rules = restrictedRolePermissions.get(roleId);

		for (const permissionId of list) {
			rules?.add(permissionId);
		}
	}

	static isPermissionRestrictedForRole(permissionId: string, roleId: string): boolean {
		if (!roleId || !permissionId) {
			throw new Error('invalid-param');
		}

		if (!restrictedRolePermissions.has(roleId)) {
			return false;
		}

		const rules = restrictedRolePermissions.get(roleId);
		if (!rules?.size) {
			return false;
		}

		return !rules.has(permissionId);
	}

	static isPermissionRestrictedForRoleList(permissionId: string, roleList: string[]): boolean {
		if (!roleList || !permissionId) {
			throw new Error('invalid-param');
		}

		for (const roleId of roleList) {
			if (this.isPermissionRestrictedForRole(permissionId, roleId)) {
				return true;
			}
		}

		return false;
	}

	static hasRestrictionsToRole(roleId: string): boolean {
		return restrictedRolePermissions.has(roleId);
	}
};

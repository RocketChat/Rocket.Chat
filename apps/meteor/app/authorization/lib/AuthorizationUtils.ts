const restrictedRolePermissions = new Map<string, Set<string>>();
const disabledRolePermissions = new Map<string, Set<string>>();

export const AuthorizationUtils = class {
	private static addRolePermissionRule(roleId: string, list: string[], permissionMap: Map<string, Set<string>>): void {
		if (!roleId || !list) {
			throw new Error('invalid-param');
		}

		if (!permissionMap.has(roleId)) {
			permissionMap.set(roleId, new Set());
		}

		const rules = permissionMap.get(roleId);

		for (const permissionId of list) {
			rules?.add(permissionId);
		}
	}

	static addRolePermissionWhiteList(roleId: string, list: string[]): void {
		this.addRolePermissionRule(roleId, list, restrictedRolePermissions);
	}

	static addRolePermissionDisabledList(roleId: string, list: string[]): void {
		this.addRolePermissionRule(roleId, list, disabledRolePermissions);
	}

	private static checkPermissionForRole(
		permissionId: string,
		roleId: string,
		permissionMap: Map<string, Set<string>>,
		modifier: 'allow' | 'deny' = 'deny',
	): boolean {
		if (!roleId || !permissionId) {
			throw new Error('invalid-param');
		}

		if (!permissionMap.has(roleId)) {
			return false;
		}

		const rules = permissionMap.get(roleId);
		if (!rules?.size) {
			return false;
		}

		const hasPermission = rules.has(permissionId);
		return modifier === 'deny' ? !hasPermission : hasPermission;
	}

	static isPermissionRestrictedForRole(permissionId: string, roleId: string): boolean {
		return this.checkPermissionForRole(permissionId, roleId, restrictedRolePermissions);
	}

	static isPermissionDisabledForRole(permissionId: string, roleId: string): boolean {
		return this.checkPermissionForRole(permissionId, roleId, disabledRolePermissions, 'allow');
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

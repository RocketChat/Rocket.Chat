import type { IPermission, IRole, IUser } from '@rocket.chat/core-typings';

import { AuthorizationUtils } from './AuthorizationUtils';

export type AuthorizationDeps = {
	/** The currently logged-in user id, or undefined. */
	getCurrentUserId: () => IUser['_id'] | undefined;
	/** The role ids assigned to a given user (Users scope). */
	getUserRoles: (userId: IUser['_id']) => IRole['_id'][] | undefined;
	/** Lookup a permission by id. */
	getPermission: (permissionId: IPermission['_id']) => IPermission | undefined;
	/** The scope of a role; defaults to 'Users' when the role is unknown. */
	getRoleScope: (roleId: IRole['_id']) => IRole['scope'] | undefined;
	/** Whether a subscription scoped to `rid` grants `roleId`. */
	hasSubscriptionRole: (rid: string, roleId: IRole['_id']) => boolean;
	/** Whether the permissions cache is hydrated; otherwise checks short-circuit to false. */
	isReady: () => boolean;
};

export type AuthorizationFunctions = {
	hasRole: (userId: IUser['_id'], roleId: IRole['_id'], scope?: string) => boolean;
	hasAllPermission: (permissions: IPermission['_id'] | IPermission['_id'][], scope?: string, scopedRoles?: IRole['_id'][]) => boolean;
	hasAtLeastOnePermission: (permissions: IPermission['_id'] | IPermission['_id'][], scope?: string) => boolean;
	/** Alias of hasAllPermission, kept for parity with the previous API. */
	hasPermission: (permissions: IPermission['_id'] | IPermission['_id'][], scope?: string, scopedRoles?: IRole['_id'][]) => boolean;
	userHasAllPermission: (
		permissions: IPermission['_id'] | IPermission['_id'][],
		scope: string | undefined,
		userId: IUser['_id'],
	) => boolean;
};

/**
 * Pure factory for the client-side authorization helpers. All store access is
 * threaded through the {@link AuthorizationDeps} accessors, so the returned
 * functions are testable in isolation and reusable across any state backend.
 */
export const createAuthorizationFunctions = (deps: AuthorizationDeps): AuthorizationFunctions => {
	const hasRole = (userId: IUser['_id'], roleId: IRole['_id'], scope?: string): boolean => {
		const roleScope = deps.getRoleScope(roleId) ?? 'Users';
		switch (roleScope) {
			case 'Subscriptions':
				if (!scope) return false;
				return deps.hasSubscriptionRole(scope, roleId);
			case 'Users':
				return deps.getUserRoles(userId)?.includes(roleId) ?? false;
			default:
				return false;
		}
	};

	const checkPermissions = (
		permissionIds: IPermission['_id'][],
		scope: string | undefined,
		userId: IUser['_id'],
		scopedRoles: IRole['_id'][] | undefined,
		quantifier: (this: IPermission['_id'][], predicate: (id: IPermission['_id']) => boolean) => boolean,
	): boolean => {
		const userRoles = deps.getUserRoles(userId);
		return quantifier.call(permissionIds, (permissionId) => {
			if (userRoles && AuthorizationUtils.isPermissionRestrictedForRoleList(permissionId, userRoles)) {
				return false;
			}
			const roles = deps.getPermission(permissionId)?.roles ?? [];
			return roles.some((roleId) => {
				if (scopedRoles?.includes(roleId)) return true;
				return hasRole(userId, roleId, scope);
			});
		});
	};

	const validatePermissions = (
		permissions: IPermission['_id'] | IPermission['_id'][],
		scope: string | undefined,
		quantifier: (this: IPermission['_id'][], predicate: (id: IPermission['_id']) => boolean) => boolean,
		userId: IUser['_id'] | undefined,
		scopedRoles?: IRole['_id'][],
	): boolean => {
		if (!userId) return false;
		if (!deps.isReady()) return false;
		const ids = ([] as IPermission['_id'][]).concat(permissions);
		return checkPermissions(ids, scope, userId, scopedRoles, quantifier);
	};

	const hasAllPermission: AuthorizationFunctions['hasAllPermission'] = (permissions, scope, scopedRoles) =>
		validatePermissions(permissions, scope, Array.prototype.every, deps.getCurrentUserId(), scopedRoles);

	const hasAtLeastOnePermission: AuthorizationFunctions['hasAtLeastOnePermission'] = (permissions, scope) =>
		validatePermissions(permissions, scope, Array.prototype.some, deps.getCurrentUserId());

	const userHasAllPermission: AuthorizationFunctions['userHasAllPermission'] = (permissions, scope, userId) =>
		validatePermissions(permissions, scope, Array.prototype.every, userId);

	return {
		hasRole,
		hasAllPermission,
		hasAtLeastOnePermission,
		hasPermission: hasAllPermission,
		userHasAllPermission,
	};
};

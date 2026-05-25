import { PermissionsCachedStore } from '../../../client/cachedStores';
import { userIdStore } from '../../../client/lib/user';
import { Permissions, Roles, Subscriptions, Users } from '../../../client/stores';
import type { AuthorizationDeps } from '../lib/createAuthorizationFunctions';
import { createAuthorizationFunctions } from '../lib/createAuthorizationFunctions';

// Bind the pure factory to live zustand store accessors. Each accessor reads
// fresh state on every call, so non-React callers (services, lib code, startup
// scripts) keep their previous "always reflects the current store" contract
// without going through Meteor's Tracker. React consumers should use the
// AuthorizationContext instead, which injects React-reactive snapshots.
const liveDeps: AuthorizationDeps = {
	getCurrentUserId: () => userIdStore.getState(),
	getUserRoles: (userId) => Users.use.getState().get(userId)?.roles,
	getPermission: (permissionId) => Permissions.use.getState().get(permissionId),
	getRoleScope: (roleId) => Roles.use.getState().get(roleId)?.scope,
	hasSubscriptionRole: (rid, roleId) =>
		Subscriptions.use
			.getState()
			.find((s) => s.rid === rid)
			?.roles?.includes(roleId) ?? false,
	isReady: () => PermissionsCachedStore.useReady.getState(),
};

export const liveAuthorizationFunctions = createAuthorizationFunctions(liveDeps);

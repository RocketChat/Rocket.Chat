import { AuthorizationContext, useUserId } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';
import { useMemo, useSyncExternalStore } from 'react';

import { createAuthorizationFunctions } from '../../app/authorization/lib/createAuthorizationFunctions';
import { PermissionsCachedStore } from '../cachedStores';
import { Permissions, Roles, Subscriptions, Users } from '../stores';

type AuthorizationProviderProps = {
	children?: ReactNode;
};

const noopSubscribe = (): (() => void) => () => undefined;

const AuthorizationProvider = ({ children }: AuthorizationProviderProps) => {
	const isReady = PermissionsCachedStore.useReady();

	if (!isReady) {
		throw (async () => {
			PermissionsCachedStore.listen();
			await PermissionsCachedStore.init();
		})();
	}

	const userId = useUserId();

	// Reactive snapshots of every store the authorization helpers read. The
	// provider re-renders whenever any of them change, and the new context
	// value (memoized below) flows down so consumers re-render through React
	// instead of through Tracker.
	const usersState = useSyncExternalStore(Users.use.subscribe, () => Users.use.getState());
	const permissionsState = useSyncExternalStore(Permissions.use.subscribe, () => Permissions.use.getState());
	const rolesState = useSyncExternalStore(Roles.use.subscribe, () => Roles.use.getState());
	const subscriptionsState = useSyncExternalStore(Subscriptions.use.subscribe, () => Subscriptions.use.getState());

	const auth = useMemo(
		() =>
			createAuthorizationFunctions({
				getCurrentUserId: () => userId,
				getUserRoles: (id) => usersState.get(id)?.roles,
				getPermission: (id) => permissionsState.get(id),
				getRoleScope: (id) => rolesState.get(id)?.scope,
				hasSubscriptionRole: (rid, roleId) => subscriptionsState.find((s) => s.rid === rid)?.roles?.includes(roleId) ?? false,
				isReady: () => true,
			}),
		[userId, usersState, permissionsState, rolesState, subscriptionsState],
	);

	const contextValue = useMemo(
		(): ContextType<typeof AuthorizationContext> => ({
			queryPermission: (permission, scope, scopeRoles) => [
				noopSubscribe,
				() => auth.hasPermission(String(permission), scope ? String(scope) : undefined, scopeRoles),
			],
			queryAtLeastOnePermission: (permissions, scope) => [
				noopSubscribe,
				() => auth.hasAtLeastOnePermission(permissions.map(String), scope ? String(scope) : undefined),
			],
			queryAllPermissions: (permissions, scope) => [
				noopSubscribe,
				() => auth.hasAllPermission(permissions.map(String), scope ? String(scope) : undefined),
			],
			queryRole: (role, scope) => [noopSubscribe, () => !!userId && auth.hasRole(userId, String(role), scope)],
			getRoles: () => Roles.state.records,
			subscribeToRoles: (callback) => Roles.use.subscribe(callback),
		}),
		[auth, userId],
	);

	return <AuthorizationContext.Provider value={contextValue}>{children}</AuthorizationContext.Provider>;
};

export default AuthorizationProvider;

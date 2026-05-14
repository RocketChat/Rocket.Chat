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

const subscribeToSubscriptions = (onStoreChange: () => void): (() => void) => Subscriptions.use.subscribe(onStoreChange);

const AuthorizationProvider = ({ children }: AuthorizationProviderProps) => {
	const isReady = PermissionsCachedStore.useReady();

	if (!isReady) {
		throw (async () => {
			PermissionsCachedStore.listen();
			await PermissionsCachedStore.init();
		})();
	}

	const userId = useUserId();

	// Reactive snapshots of the three stores that change infrequently (admin-driven
	// or login-time only). A re-render here propagates the new auth answer through
	// context to every consumer without forcing them to re-evaluate `hasPermission`
	// for unrelated traffic. Subscriptions.use is intentionally NOT observed here
	// — it updates on every incoming message, member change, and unread-count flip,
	// so subscribing globally would re-render every gated component on every chat
	// frame. Subscription-scoped permission checks subscribe per-call below.
	const usersState = useSyncExternalStore(Users.use.subscribe, () => Users.use.getState());
	const permissionsState = useSyncExternalStore(Permissions.use.subscribe, () => Permissions.use.getState());
	const rolesState = useSyncExternalStore(Roles.use.subscribe, () => Roles.use.getState());

	const auth = useMemo(
		() =>
			createAuthorizationFunctions({
				getCurrentUserId: () => userId,
				getUserRoles: (id) => usersState.get(id)?.roles,
				getPermission: (id) => permissionsState.get(id),
				getRoleScope: (id) => rolesState.get(id)?.scope,
				// Read Subscriptions live — reactivity for scoped checks is wired through
				// the per-call subscribe returned by queryPermission/queryRole below.
				hasSubscriptionRole: (rid, roleId) =>
					Subscriptions.use
						.getState()
						.find((s) => s.rid === rid)
						?.roles?.includes(roleId) ?? false,
				isReady: () => true,
			}),
		[userId, usersState, permissionsState, rolesState],
	);

	const contextValue = useMemo(
		(): ContextType<typeof AuthorizationContext> => ({
			// Callers without `scope` never touch Subscriptions (the factory short-circuits
			// at the role-scope gate). They rely on context-value identity for re-renders
			// from Users/Permissions/Roles changes — which is why subscribe is noop.
			// Callers with a `scope` (room id) DO touch Subscriptions, so we attach a
			// per-call subscribe to that store so they re-evaluate when subscriptions
			// for the relevant room flip without dragging the rest of the tree along.
			queryPermission: (permission, scope, scopeRoles) => [
				scope !== undefined ? subscribeToSubscriptions : noopSubscribe,
				() => auth.hasPermission(String(permission), scope ? String(scope) : undefined, scopeRoles),
			],
			queryAtLeastOnePermission: (permissions, scope) => [
				scope !== undefined ? subscribeToSubscriptions : noopSubscribe,
				() => auth.hasAtLeastOnePermission(permissions.map(String), scope ? String(scope) : undefined),
			],
			queryAllPermissions: (permissions, scope) => [
				scope !== undefined ? subscribeToSubscriptions : noopSubscribe,
				() => auth.hasAllPermission(permissions.map(String), scope ? String(scope) : undefined),
			],
			queryRole: (role, scope) => [
				scope !== undefined ? subscribeToSubscriptions : noopSubscribe,
				() => !!userId && auth.hasRole(userId, String(role), scope),
			],
			getRoles: () => Roles.state.records,
			subscribeToRoles: (callback) => Roles.use.subscribe(callback),
		}),
		[auth, userId],
	);

	return <AuthorizationContext.Provider value={contextValue}>{children}</AuthorizationContext.Provider>;
};

export default AuthorizationProvider;

import type { IUser } from '@rocket.chat/core-typings';
import { AuthorizationContext, useUserId } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';
import { useMemo, useSyncExternalStore } from 'react';

import { createAuthorizationFunctions } from '../../app/authorization/lib/createAuthorizationFunctions';
import { PermissionsCachedStore } from '../cachedStores';
import { Permissions, Roles, Subscriptions, Users } from '../stores';

// Only the slice of IUser that the authorization helpers actually read.
// Snapshotting just `roles` (instead of the full user document) keeps the
// provider from re-rendering on presence/status updates, last-login flips,
// avatar etag changes, etc. — none of which affect any permission answer.
type AuthorizableUser = Pick<IUser, '_id' | 'roles'>;

type AuthorizationProviderProps = {
	children?: ReactNode;
};

const noopSubscribe = (): (() => void) => () => undefined;

const subscribeToSubscriptions = (onStoreChange: () => void): (() => void) => Subscriptions.use.subscribe(onStoreChange);

const selectUserRoles = (userId: IUser['_id'] | undefined): AuthorizableUser['roles'] | undefined => {
	if (!userId) return undefined;
	return Users.use.getState().get(userId)?.roles;
};

const AuthorizationProvider = ({ children }: AuthorizationProviderProps) => {
	const isReady = PermissionsCachedStore.useReady();

	if (!isReady) {
		throw (async () => {
			PermissionsCachedStore.listen();
			await PermissionsCachedStore.init();
		})();
	}

	const userId = useUserId();

	// Permissions and Roles change infrequently (admin-driven or login-time only);
	// observing the whole map is cheap and re-renders propagate the new auth
	// answers through context to every consumer.
	const permissionsState = useSyncExternalStore(Permissions.use.subscribe, () => Permissions.use.getState());
	const rolesState = useSyncExternalStore(Roles.use.subscribe, () => Roles.use.getState());
	// For Users, only the current user's `roles` array is relevant for auth
	// decisions (hooks dispatch via getCurrentUserId; `userHasAllPermission` with
	// an arbitrary userId has no real callers). Subscribing to the full Users map
	// would re-render the provider on every presence update for every user. The
	// custom getSnapshot returns the same array reference until the current
	// user's roles actually change, so useSyncExternalStore short-circuits via
	// Object.is and the provider stays still through unrelated user churn.
	const currentUserRoles = useSyncExternalStore(Users.use.subscribe, () => selectUserRoles(userId));
	// Subscriptions.use is intentionally NOT observed here — it updates on every
	// incoming message, member change, and unread-count flip. Subscription-scoped
	// permission checks subscribe per-call below.

	const auth = useMemo(
		() =>
			createAuthorizationFunctions({
				getCurrentUserId: () => userId,
				// Fast path for the only userId hook consumers ever pass; live read for
				// any other userId (only userHasAllPermission can reach this branch).
				getUserRoles: (id) => (id === userId ? currentUserRoles : Users.use.getState().get(id)?.roles),
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
		[userId, currentUserRoles, permissionsState, rolesState],
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

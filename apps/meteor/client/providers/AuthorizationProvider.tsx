import { AuthorizationContext, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { hasPermission, hasAtLeastOnePermission, hasAllPermission, hasRole } from '../../app/authorization/client';
import { PermissionsCachedStore } from '../cachedStores';
import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';
import { Roles } from '../stores';

type AuthorizationProviderProps = {
	children?: ReactNode;
};

const AuthorizationProvider = ({ children }: AuthorizationProviderProps) => {
	useEffect(() => {
		PermissionsCachedStore.listen();
	}, []);

	const isLoading = !PermissionsCachedStore.useReady();

	if (isLoading) {
		throw (async () => {
			await PermissionsCachedStore.init();
		})();
	}

	const userId = useUserId();

	const contextValue = useMemo(
		() => ({
			queryPermission: createReactiveSubscriptionFactory((permission, scope, scopeRoles) => hasPermission(permission, scope, scopeRoles)),
			queryAtLeastOnePermission: createReactiveSubscriptionFactory((permissions, scope) => hasAtLeastOnePermission(permissions, scope)),
			queryAllPermissions: createReactiveSubscriptionFactory((permissions, scope) => hasAllPermission(permissions, scope)),
			queryRole: createReactiveSubscriptionFactory((role, scope?) => !!userId && hasRole(userId as string, role, scope)),
			getRoles: () => Roles.state.records,
			subscribeToRoles: (callback: () => void) => Roles.use.subscribe(callback),
		}),
		[userId],
	);

	return <AuthorizationContext.Provider children={children} value={contextValue} />;
};

export default AuthorizationProvider;

import { AuthorizationContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { hasPermission, hasAtLeastOnePermission, hasAllPermission, hasRole } from '../../app/authorization/client';
import { PermissionsCachedStore } from '../cachedStores';
import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';
import { Roles } from '../stores';

const contextValue = {
	queryPermission: createReactiveSubscriptionFactory((permission, scope, scopeRoles) => hasPermission(permission, scope, scopeRoles)),
	queryAtLeastOnePermission: createReactiveSubscriptionFactory((permissions, scope) => hasAtLeastOnePermission(permissions, scope)),
	queryAllPermissions: createReactiveSubscriptionFactory((permissions, scope) => hasAllPermission(permissions, scope)),
	queryRole: createReactiveSubscriptionFactory((role, scope?) => !!Meteor.userId() && hasRole(Meteor.userId() as string, role, scope)),
	getRoles: () => Roles.state.records,
	subscribeToRoles: (callback: () => void) => Roles.use.subscribe(callback),
};

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

	return <AuthorizationContext.Provider children={children} value={contextValue} />;
};

export default AuthorizationProvider;

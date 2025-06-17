import { AuthorizationContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { hasPermission, hasAtLeastOnePermission, hasAllPermission, hasRole } from '../../app/authorization/client';
import { Roles, AuthzCachedCollection } from '../../app/models/client';
import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';

const contextValue = {
	queryPermission: createReactiveSubscriptionFactory((permission, scope, scopeRoles) => hasPermission(permission, scope, scopeRoles)),
	queryAtLeastOnePermission: createReactiveSubscriptionFactory((permissions, scope) => hasAtLeastOnePermission(permissions, scope)),
	queryAllPermissions: createReactiveSubscriptionFactory((permissions, scope) => hasAllPermission(permissions, scope)),
	queryRole: createReactiveSubscriptionFactory(
		(role, scope?, ignoreSubscriptions = false) =>
			!!Meteor.userId() && hasRole(Meteor.userId() as string, role, scope, ignoreSubscriptions),
	),
	getRoles: () => Roles.state.records,
	subscribeToRoles: (callback: () => void) => Roles.use.subscribe(callback),
};

type AuthorizationProviderProps = {
	children?: ReactNode;
};

const AuthorizationProvider = ({ children }: AuthorizationProviderProps) => {
	useEffect(() => {
		AuthzCachedCollection.listen();
	}, []);

	return <AuthorizationContext.Provider children={children} value={contextValue} />;
};

export default AuthorizationProvider;

import type { IRole } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { AuthorizationContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ReactNode } from 'react';
import { useCallback, useEffect } from 'react';

import { hasPermission, hasAtLeastOnePermission, hasAllPermission, hasRole } from '../../app/authorization/client';
import { Roles, AuthzCachedCollection } from '../../app/models/client';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';

class RoleStore extends Emitter<{
	change: { [_id: string]: IRole };
}> {
	roles: { [_id: string]: IRole } = {};
}

const contextValue = {
	queryPermission: createReactiveSubscriptionFactory((permission, scope, scopeRoles) => hasPermission(permission, scope, scopeRoles)),
	queryAtLeastOnePermission: createReactiveSubscriptionFactory((permissions, scope) => hasAtLeastOnePermission(permissions, scope)),
	queryAllPermissions: createReactiveSubscriptionFactory((permissions, scope) => hasAllPermission(permissions, scope)),
	queryRole: createReactiveSubscriptionFactory(
		(role, scope?, ignoreSubscriptions = false) =>
			!!Meteor.userId() && hasRole(Meteor.userId() as string, role, scope, ignoreSubscriptions),
	),
	roleStore: new RoleStore(),
};

type AuthorizationProviderProps = {
	children?: ReactNode;
};

const AuthorizationProvider = ({ children }: AuthorizationProviderProps) => {
	const roles = useReactiveValue(
		useCallback(
			() =>
				Roles.find()
					.fetch()
					.reduce(
						(ret, obj) => {
							ret[obj._id] = obj;
							return ret;
						},
						{} as Record<string, IRole>,
					),
			[],
		),
	);

	useEffect(() => {
		AuthzCachedCollection.listen();
	}, []);

	useEffect(() => {
		contextValue.roleStore.roles = roles;
		contextValue.roleStore.emit('change', roles);
	}, [roles]);

	return <AuthorizationContext.Provider children={children} value={contextValue} />;
};

export default AuthorizationProvider;

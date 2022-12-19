import type { IRole } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { AuthorizationContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { FC } from 'react';
import React, { useCallback, useEffect } from 'react';

import { hasPermission, hasAtLeastOnePermission, hasAllPermission, hasRole } from '../../app/authorization/client';
import { Roles } from '../../app/models/client/models/Roles';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';

class RoleStore extends Emitter<{
	change: { [_id: string]: IRole };
}> {
	roles: { [_id: string]: IRole } = {};
}

const contextValue = {
	queryPermission: createReactiveSubscriptionFactory((permission, scope) => hasPermission(permission, scope)),
	queryAtLeastOnePermission: createReactiveSubscriptionFactory((permissions, scope) => hasAtLeastOnePermission(permissions, scope)),
	queryAllPermissions: createReactiveSubscriptionFactory((permissions, scope) => hasAllPermission(permissions, scope)),
	queryRole: createReactiveSubscriptionFactory((role) => !!Meteor.userId() && hasRole(Meteor.userId() as string, role)),
	roleStore: new RoleStore(),
};

const AuthorizationProvider: FC = ({ children }) => {
	const roles = useReactiveValue(
		useCallback(
			() =>
				Roles.find()
					.fetch()
					.reduce((ret, obj) => {
						ret[obj._id] = obj;
						return ret;
					}, {}),
			[],
		),
	);

	useEffect(() => {
		contextValue.roleStore.roles = roles;
		contextValue.roleStore.emit('change', roles);
	}, [roles]);

	return <AuthorizationContext.Provider children={children} value={contextValue} />;
};

export default AuthorizationProvider;

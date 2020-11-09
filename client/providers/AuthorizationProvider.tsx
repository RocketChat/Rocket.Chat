import React, { FC, useCallback, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';

import {
	hasPermission,
	hasAtLeastOnePermission,
	hasAllPermission,
	hasRole,
} from '../../app/authorization/client';
import { AuthorizationContext, RoleStore } from '../contexts/AuthorizationContext';
import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { Roles } from '../../app/models/client/models/Roles';


const contextValue = {
	queryPermission: createReactiveSubscriptionFactory(
		(permission, scope) => hasPermission(permission, scope),
	),
	queryAtLeastOnePermission: createReactiveSubscriptionFactory(
		(permissions, scope) => hasAtLeastOnePermission(permissions, scope),
	),
	queryAllPermissions: createReactiveSubscriptionFactory(
		(permissions, scope) => hasAllPermission(permissions, scope),
	),
	queryRole: createReactiveSubscriptionFactory(
		(role) => hasRole(Meteor.userId(), role),
	),
	roleStore: new RoleStore(),
};


const AuthorizationProvider: FC = ({ children }) => {
	const roles = useReactiveValue(useCallback(() => Roles.find().fetch().reduce((ret, obj) => {
		ret[obj._id] = obj;
		return ret;
	}, {}), []));

	useEffect(() => {
		contextValue.roleStore.roles = roles;
		contextValue.roleStore.emit('change', roles);
	}, [roles]);

	return <AuthorizationContext.Provider children={children} value={contextValue} />;
};

export default AuthorizationProvider;

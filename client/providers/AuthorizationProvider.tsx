import React, { FC } from 'react';
import { Meteor } from 'meteor/meteor';

import {
	hasPermission,
	hasAtLeastOnePermission,
	hasAllPermission,
	hasRole,
} from '../../app/authorization/client';
import { AuthorizationContext } from '../contexts/AuthorizationContext';
import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';

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
};

const AuthorizationProvider: FC = ({ children }) =>
	<AuthorizationContext.Provider children={children} value={contextValue} />;

export default AuthorizationProvider;

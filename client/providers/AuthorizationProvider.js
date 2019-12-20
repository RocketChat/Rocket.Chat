import React from 'react';
import { Meteor } from 'meteor/meteor';

import {
	hasPermission,
	hasAtLeastOnePermission,
	hasAllPermission,
} from '../../app/authorization/client/hasPermission';
import { AuthorizationContext } from '../contexts/AuthorizationContext';
import { hasRole } from '../../app/authorization/client';
import { createObservableFromReactive } from './createObservableFromReactive';

const contextValue = {
	hasPermission: createObservableFromReactive(hasPermission),
	hasAtLeastOnePermission: createObservableFromReactive(hasAtLeastOnePermission),
	hasAllPermission: createObservableFromReactive(hasAllPermission),
	hasRole: createObservableFromReactive((role) => hasRole(Meteor.userId(), role)),
};

export function AuthorizationProvider({ children }) {
	return <AuthorizationContext.Provider children={children} value={contextValue} />;
}

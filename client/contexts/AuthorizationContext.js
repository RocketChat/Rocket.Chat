import { createContext, useCallback, useContext } from 'react';

import { useObservableValue } from '../hooks/useObservableValue';

export const AuthorizationContext = createContext({
	hasPermission: () => {},
	hasAtLeastOnePermission: () => {},
	hasAllPermissions: () => {},
});

export const usePermission = (permission, scope) => {
	const { hasPermission } = useContext(AuthorizationContext);
	return useObservableValue(useCallback((listener) =>
		hasPermission(permission, scope, listener), [permission, scope]));
};

export const useAtLeastOnePermission = (permissions, scope) => {
	const { hasAtLeastOnePermission } = useContext(AuthorizationContext);
	return useObservableValue(useCallback((listener) =>
		hasAtLeastOnePermission(permissions, scope, listener), [permissions, scope]));
};

export const useAllPermissions = (permissions, scope) => {
	const { hasAllPermissions } = useContext(AuthorizationContext);
	return useObservableValue(useCallback((listener) =>
		hasAllPermissions(permissions, scope, listener), [permissions, scope]));
};

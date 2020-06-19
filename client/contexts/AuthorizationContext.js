import { createContext, useCallback, useContext } from 'react';

import { useObservableValue } from '../hooks/useObservableValue';

export const AuthorizationContext = createContext({
	hasPermission: () => {},
	hasAtLeastOnePermission: () => {},
	hasAllPermissions: () => {},
	hasRole: () => {},
});

export const usePermission = (permission, scope) => {
	const { hasPermission } = useContext(AuthorizationContext);
	return useObservableValue(useCallback((listener) =>
		hasPermission(permission, scope, listener), [hasPermission, permission, scope]));
};

export const useAtLeastOnePermission = (permissions, scope) => {
	const { hasAtLeastOnePermission } = useContext(AuthorizationContext);
	return useObservableValue(useCallback((listener) =>
		hasAtLeastOnePermission(permissions, scope, listener), [hasAtLeastOnePermission, permissions, scope]));
};

export const useAllPermissions = (permissions, scope) => {
	const { hasAllPermissions } = useContext(AuthorizationContext);
	return useObservableValue(useCallback((listener) =>
		hasAllPermissions(permissions, scope, listener), [hasAllPermissions, permissions, scope]));
};

export const useRole = (role) => {
	const { hasRole } = useContext(AuthorizationContext);
	return useObservableValue(useCallback((listener) =>
		hasRole(role, listener), [hasRole, role]));
};

import { useCallback, useContext, useSyncExternalStore } from 'react';

import { AuthorizationContext } from '../AuthorizationContext';

export const useRolesDescription = () => {
	const { getRoles, subscribeToRoles } = useContext(AuthorizationContext);

	const roles = useSyncExternalStore(subscribeToRoles, getRoles);

	return useCallback((ids: string[]) => ids.map((role) => roles.get(role)?.description || roles.get(role)?.name || role), [roles]);
};

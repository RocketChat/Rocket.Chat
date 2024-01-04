import type { IRole } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { AuthorizationContext } from '../AuthorizationContext';

/**
 * Check if the user has the permission considering the user have the scoped roles
 * @param permission The permission to check
 * @param scopedRoles The roles to be also considered
 * @returns boolean
 */

export const usePermissionWithScopedRoles = (permission: string, scopedRoles: IRole['_id'][]): boolean => {
	const { queryPermission } = useContext(AuthorizationContext);
	const [subscribe, getSnapshot] = useMemo(
		() => queryPermission(permission, undefined, scopedRoles),
		[queryPermission, permission, scopedRoles],
	);
	return useSyncExternalStore(subscribe, getSnapshot);
};

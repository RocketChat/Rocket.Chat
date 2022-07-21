import type { ObjectId } from 'mongodb';
import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { AuthorizationContext } from '../AuthorizationContext';

export const usePermission = (permission: string | ObjectId, scope?: string | ObjectId): boolean => {
	const { queryPermission } = useContext(AuthorizationContext);
	const [subscribe, getSnapshot] = useMemo(() => queryPermission(permission, scope), [queryPermission, permission, scope]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

import type { ObjectId } from 'mongodb';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import { AuthorizationContext } from '../AuthorizationContext';

export const usePermission = (permission: string | ObjectId, scope?: string | ObjectId): boolean => {
	const { queryPermission } = useContext(AuthorizationContext);
	const [subscribe, getSnapshot] = useMemo(() => queryPermission(permission, scope), [queryPermission, permission, scope]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

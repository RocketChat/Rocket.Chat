import type { ObjectId } from 'mongodb';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import { AuthorizationContext } from '../AuthorizationContext';

export const useAllPermissions = (permissions: (string | ObjectId)[], scope?: string | ObjectId): boolean => {
	const { queryAllPermissions } = useContext(AuthorizationContext);
	const [subscribe, getSnapshot] = useMemo(() => queryAllPermissions(permissions, scope), [queryAllPermissions, permissions, scope]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

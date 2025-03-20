import type { ObjectId } from 'mongodb';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import { AuthorizationContext } from '../AuthorizationContext';

export const useRole = (role: string | ObjectId): boolean => {
	const { queryRole } = useContext(AuthorizationContext);
	const [subscribe, getSnapshot] = useMemo(() => queryRole(role), [queryRole, role]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

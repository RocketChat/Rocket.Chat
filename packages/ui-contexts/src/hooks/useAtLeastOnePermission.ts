import type { ObjectId } from 'mongodb';
import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { AuthorizationContext } from '../AuthorizationContext';

export const useAtLeastOnePermission = (permissions: (string | ObjectId)[], scope?: string | ObjectId): boolean => {
	const { queryAtLeastOnePermission } = useContext(AuthorizationContext);
	const [subscribe, getSnapshot] = useMemo(
		() => queryAtLeastOnePermission(permissions, scope),
		[queryAtLeastOnePermission, permissions, scope],
	);
	return useSyncExternalStore(subscribe, getSnapshot);
};

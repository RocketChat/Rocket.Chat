import type { ObjectId } from 'mongodb';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { AuthorizationContext } from '../AuthorizationContext';

export const useAtLeastOnePermission = (permissions: (string | ObjectId)[], scope?: string | ObjectId): boolean => {
	const { queryAtLeastOnePermission } = useContext(AuthorizationContext);
	const subscription = useMemo(() => queryAtLeastOnePermission(permissions, scope), [queryAtLeastOnePermission, permissions, scope]);
	return useSubscription(subscription);
};

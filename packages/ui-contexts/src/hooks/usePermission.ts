import type { ObjectId } from 'mongodb';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { AuthorizationContext } from '../AuthorizationContext';

export const usePermission = (permission: string | ObjectId, scope?: string | ObjectId): boolean => {
	const { queryPermission } = useContext(AuthorizationContext);
	const subscription = useMemo(() => queryPermission(permission, scope), [queryPermission, permission, scope]);
	return useSubscription(subscription);
};

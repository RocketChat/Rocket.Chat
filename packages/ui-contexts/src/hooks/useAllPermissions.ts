import type { ObjectId } from 'mongodb';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { AuthorizationContext } from '../AuthorizationContext';

export const useAllPermissions = (permissions: (string | ObjectId)[], scope?: string | ObjectId): boolean => {
	const { queryAllPermissions } = useContext(AuthorizationContext);
	const subscription = useMemo(() => queryAllPermissions(permissions, scope), [queryAllPermissions, permissions, scope]);
	return useSubscription(subscription);
};

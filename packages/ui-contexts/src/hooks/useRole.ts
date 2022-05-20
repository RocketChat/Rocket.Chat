import type { ObjectId } from 'mongodb';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { AuthorizationContext } from '../AuthorizationContext';

export const useRole = (role: string | ObjectId): boolean => {
	const { queryRole } = useContext(AuthorizationContext);
	const subscription = useMemo(() => queryRole(role), [queryRole, role]);
	return useSubscription(subscription);
};

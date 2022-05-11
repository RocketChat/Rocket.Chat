import type { IRoom } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { Fields, UserContext } from '../UserContext';

export const useUserRoom = (rid: string, fields?: Fields): IRoom | undefined => {
	const { queryRoom } = useContext(UserContext);
	const subscription = useMemo(() => queryRoom({ _id: rid }, fields), [queryRoom, rid, fields]);
	return useSubscription(subscription);
};

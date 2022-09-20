import type { IRoom } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { Fields } from '../UserContext';
import { UserContext } from '../UserContext';

export const useUserRoom = (rid: string, fields?: Fields): IRoom | undefined => {
	const { queryRoom } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => queryRoom({ _id: rid }, fields), [queryRoom, rid, fields]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

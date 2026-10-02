import type { IUser } from '@rocket.chat/core-typings';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import { UserContext } from '../UserContext';

export const useUser = (): IUser | null => {
	const { queryUser } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => queryUser(), [queryUser]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

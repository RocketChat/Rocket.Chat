import { useCallback, useSyncExternalStore } from 'react';

import { userStorage } from '../lib/user';

export const useUserStorageValue = (key: string): string | undefined => {
	const subscribe = useCallback((callback: () => void) => userStorage.on('change', callback), []);

	const getSnapshot = useCallback(() => userStorage.getItem(key) ?? undefined, [key]);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

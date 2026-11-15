import { useMemo, useSyncExternalStore } from 'react';

import { RoomManager, getCollapsibleEventKey, useOpenedRoom } from '../../../lib/RoomManager';

export const useIsCollapsibleToggled = (key: string | undefined): boolean => {
	const rid = useOpenedRoom();

	const { subscribe, getSnapshot } = useMemo(() => {
		const store = rid && key ? RoomManager.getStore(rid) : undefined;

		if (!store || !key) {
			return {
				subscribe: () => () => undefined,
				getSnapshot: () => false,
			};
		}

		return {
			subscribe: (cb: () => void) => store.on(getCollapsibleEventKey(key), cb),
			getSnapshot: () => store.isCollapsibleToggled(key),
		};
	}, [rid, key]);

	return useSyncExternalStore(subscribe, getSnapshot);
};

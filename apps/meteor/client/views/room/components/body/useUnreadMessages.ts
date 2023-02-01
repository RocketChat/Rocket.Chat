import type { IRoom } from '@rocket.chat/core-typings';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { RoomManager, RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

interface IUnreadMessages {
	count: number;
	since?: Date;
}

export const useUnreadMessages = (room: IRoom): readonly [data: IUnreadMessages, setUnreadCount: Dispatch<SetStateAction<number>>] => {
	const notLoadedCount = useReactiveValue(useCallback(() => RoomHistoryManager.getRoom(room._id).unreadNotLoaded.get(), [room._id]));
	const [loadedCount, setLoadedCount] = useState(0);

	const count = useMemo(() => notLoadedCount + loadedCount, [notLoadedCount, loadedCount]);

	const since = useReactiveValue(useCallback(() => RoomManager.getOpenedRoomByRid(room._id)?.unreadSince.get(), [room._id]));

	return useMemo(() => {
		if (count && since) {
			return [{ count, since }, setLoadedCount];
		}

		return [{ count: loadedCount, since: undefined }, setLoadedCount];
	}, [count, loadedCount, since]);
};

import type { IRoom } from '@rocket.chat/core-typings';
import { useEffect, useRef } from 'react';

import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(roomId: IRoom['_id']) {
	const ref = useRef<HTMLElement | null>(null);
	useEffect(() => {
		const store = RoomManager.getStore(roomId);

		if (store?.scroll && !store.atBottom) {
			ref.current?.scrollTo({ top: store.scroll });
		} else {
			ref.current?.scrollTo({ top: ref.current?.scrollHeight });
		}
	}, [roomId]);

	return ref;
}

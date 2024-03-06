import type { IRoom } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(roomId: IRoom['_id']) {
	const ref = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}
			const store = RoomManager.getStore(roomId);

			if (store?.scroll && !store.atBottom) {
				node.scrollTo({
					left: 30,
					top: store.scroll,
				});
			} else {
				node.scrollTo({
					top: node.scrollHeight,
				});
			}
		},
		[roomId],
	);

	return ref;
}

import type { IRoom } from '@rocket.chat/core-typings';
import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { RoomHistoryManager } from '../../../../lib/RoomHistoryManager';

/**
 * Asks for the first page of the room's history again when the viewer acts in a room whose first page failed to load, where nothing
 * else would. A room the viewer cannot preview has no history to ask for.
 */
export const useRetryFirstPage = (rid: IRoom['_id'], canPreview: boolean): (() => void) => {
	const isJumping = !!useSearchParameter('msg');

	return useCallback(() => {
		if (
			!canPreview ||
			isJumping ||
			RoomHistoryManager.isLoaded(rid) ||
			RoomHistoryManager.isLoading(rid) ||
			!RoomHistoryManager.hasMore(rid)
		) {
			return;
		}
		void RoomHistoryManager.getMore(rid).catch(() => undefined);
	}, [rid, canPreview, isJumping]);
};

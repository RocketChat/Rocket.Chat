import type { IRoom } from '@rocket.chat/core-typings';
import type { RefObject } from 'react';
import { useCallback } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(roomId: IRoom['_id']) {
	const refCallback = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}
			const store = RoomManager.getStore(roomId);

			if (store?.scroll && !store.atBottom) {
				node.scrollTo({ top: store.scroll });
			} else {
				node.scrollTo({ top: node.scrollHeight });
			}

			const handleWrapperScroll = withThrottling({ wait: 100 })(() => {
				store?.update({ scroll: node.scrollTop, atBottom: isAtBottom(node, 50) });
			});

			node.addEventListener('scroll', handleWrapperScroll, {
				passive: true,
			});
		},
		[roomId],
	);

	return refCallback as unknown as RefObject<HTMLElement>;
}

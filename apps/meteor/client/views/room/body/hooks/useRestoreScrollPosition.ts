import type { IRoom } from '@rocket.chat/core-typings';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { RefObject } from 'react';
import { useCallback } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(roomId: IRoom['_id']) {
	const ref = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}
			const store = RoomManager.getStore(roomId);
			console.log({ store });
			if (store?.scroll && !store.atBottom) {
				// console.log('SCROLLING TO', store.scroll);
				// node.scrollTo({
				// 	left: 30,
				// 	top: store.scroll,
				// });
			} else {
				// console.log('SCROLLING TO BOTTOM?');
				// node.scrollTo({
				// 	top: node.scrollHeight,
				// });
			}
		},
		[roomId],
	);

	const refCallback = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			// const store = RoomManager.getStore(roomId);

			// STORE UPDATE SCROLL POSITION
			const handleWrapperScroll = withThrottling({ wait: 10 })(() => {
				// console.log('SETTING NODE TO', node.scrollTop);
				// store?.update({ scroll: node.scrollTop, atBottom: isAtBottom(node, 50) });
			});

			node.addEventListener('scroll', handleWrapperScroll, {
				passive: true,
			});
		},
		[roomId],
	);

	return {
		innerRef: useMergedRefs(refCallback, ref) as unknown as RefObject<HTMLElement>,
	};
}

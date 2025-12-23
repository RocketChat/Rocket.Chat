import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(rid: string, wait = 100) {
	const jumpToRef = useRef<HTMLElement>(undefined);
	const ref = useSafeRefCallback(
		useCallback(
			(node: HTMLElement | null) => {
				if (!node) {
					return;
				}
				const store = RoomManager.getStore(rid);
				if (store?.atBottom) {
					node.scrollTop = node.scrollHeight;
					node.scrollLeft = 30;
				}
				if (!jumpToRef.current && store?.scroll !== undefined && !store.atBottom) {
					node.scrollTop = store.scroll;
					node.scrollLeft = 30;
				}
				const handleWrapperScroll = withThrottling({ wait })((event) => {
					const store = RoomManager.getStore(rid);
					store?.update({ scroll: event.target.scrollTop, atBottom: isAtBottom(event.target, 50) });
				});
				node.addEventListener('scroll', handleWrapperScroll, { passive: true });
				return () => {
					handleWrapperScroll.cancel();
					node.removeEventListener('scroll', handleWrapperScroll);
				};
			},
			[rid, wait],
		),
	);

	return {
		jumpToRef,
		innerRef: ref,
	};
}

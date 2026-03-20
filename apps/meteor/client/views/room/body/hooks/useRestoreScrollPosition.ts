import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';
import type { VirtualizerHandle } from '../../MessageList/MessageList';

export function useRestoreScrollPosition(rid: string, virtualizerRef?: RefObject<VirtualizerHandle | null>, wait = 100) {
	const jumpToRef = useRef<HTMLElement>(undefined);
	const ref = useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
				const store = RoomManager.getStore(rid);
				if (store?.atBottom) {
					if (virtualizerRef?.current) {
						virtualizerRef.current.scrollToEnd();
					} else {
						node.scrollTop = node.scrollHeight;
						node.scrollLeft = 30;
					}
				}
				if (!jumpToRef.current && store?.scroll !== undefined && !store.atBottom) {
					if (virtualizerRef?.current) {
						virtualizerRef.current.scrollToOffset(store.scroll);
					} else {
						node.scrollTop = store.scroll;
						node.scrollLeft = 30;
					}
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
			[rid, wait, virtualizerRef],
		),
	);

	return {
		jumpToRef,
		innerRef: ref,
	};
}

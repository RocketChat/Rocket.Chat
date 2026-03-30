import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback, useRef } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { useMessageListVirtualizer } from '../../../../components/message/list/MessageListContext';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(rid: string, wait = 100) {
	const virtualizerRef = useMessageListVirtualizer();
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

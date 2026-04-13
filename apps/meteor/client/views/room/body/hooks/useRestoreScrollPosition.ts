import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject } from 'react';
import { useCallback } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(rid: string, isJumpingToMessage: MutableRefObject<boolean>, wait = 100) {
	const ref = useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
				const store = RoomManager.getStore(rid);
				if (store?.atBottom) {
					node.scrollTop = node.scrollHeight;
					node.scrollLeft = 30;
				}
				if (!isJumpingToMessage.current && store?.scroll !== undefined && !store.atBottom) {
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
			[rid, wait, isJumpingToMessage],
		),
	);

	return {
		innerRef: ref,
	};
}

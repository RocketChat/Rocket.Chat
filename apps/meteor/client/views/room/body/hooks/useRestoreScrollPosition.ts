import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { RefObject } from 'react';
import { useCallback } from 'react';

import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';
import type { VirtualizerHandle } from '../../MessageList/VirtualizedMessageList';

export function useStoreScrollPosition(rid: string, wait = 100, virtualizerHandle: RefObject<VirtualizerHandle>) {
	const ref = useSafeRefCallback(
		useCallback(
			(node: HTMLElement) => {
				const handleWrapperScroll = withThrottling({ wait })((event) => {
					const store = RoomManager.getStore(rid);
					store?.update({ scroll: event.target.scrollTop, atBottom: virtualizerHandle?.current?.isAtBottom() });
				});
				node.addEventListener('scroll', handleWrapperScroll, { passive: true });
				return () => {
					handleWrapperScroll.cancel();
					node.removeEventListener('scroll', handleWrapperScroll);
				};
			},
			[rid, virtualizerHandle, wait],
		),
	);

	return {
		innerRef: ref,
	};
}

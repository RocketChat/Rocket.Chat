import type { IRoom } from '@rocket.chat/core-typings';
import { useCallback, useEffect, useRef } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(roomId: IRoom['_id']) {
	const ref = useRef<HTMLElement>(null);

	const handleRestoreScroll = useCallback(() => {
		if (!ref.current) {
			return;
		}

		const store = RoomManager.getStore(roomId);

		if (store?.scroll && !store.atBottom) {
			ref.current.scrollTop = store.scroll;
			ref.current.scrollLeft = 30;
		} else {
			ref.current.scrollTop = ref.current.scrollHeight;
		}
	}, [roomId]);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		handleRestoreScroll();

		const refValue = ref.current;
		const store = RoomManager.getStore(roomId);

		const handleWrapperScroll = withThrottling({ wait: 100 })((event) => {
			store?.update({ scroll: event.target.scrollTop, atBottom: isAtBottom(event.target, 50) });
		});

		refValue.addEventListener('scroll', handleWrapperScroll, { passive: true });

		return () => {
			refValue.removeEventListener('scroll', handleWrapperScroll);
		};
	}, [roomId, handleRestoreScroll]);

	return {
		innerRef: ref,
	};
}

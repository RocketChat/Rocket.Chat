import { useCallback, useEffect, useRef } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager, useOpenedRoom, useSecondLevelOpenedRoom } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition() {
	const ref = useRef<HTMLElement>(null);
	const parentRoomId = useOpenedRoom();
	const roomId = useSecondLevelOpenedRoom() ?? parentRoomId;

	const handleRestoreScroll = useCallback(() => {
		if (!ref.current || !roomId) {
			return;
		}

		const store = RoomManager.getStore(roomId);

		if (store?.scroll !== undefined && !store.atBottom) {
			ref.current.scrollTop = store.scroll;
			ref.current.scrollLeft = 30;
		}
	}, [roomId]);

	useEffect(() => {
		if (!ref.current || !roomId) {
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

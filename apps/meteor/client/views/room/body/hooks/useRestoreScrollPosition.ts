import type { IRoom } from '@rocket.chat/core-typings';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(roomId: IRoom['_id']) {
	const ref = useRef<HTMLElement | null>(null);
	useEffect(() => {
		const store = RoomManager.getStore(roomId);

		if (store?.scroll && !store.atBottom) {
			ref.current?.scrollTo({ top: store.scroll });
		} else {
			ref.current?.scrollTo({ top: ref.current?.scrollHeight });
		}
	}, [roomId]);

	const refCallback = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const store = RoomManager.getStore(roomId);

			const handleWrapperScroll = withThrottling({ wait: 100 })(() => {
				store?.update({ scroll: node.scrollTop, atBottom: isAtBottom(node, 50) });
			});

			node.addEventListener('scroll', handleWrapperScroll, {
				passive: true,
			});
		},
		[roomId],
	);

	return useMergedRefs(refCallback, ref) as unknown as RefObject<HTMLElement>;
}

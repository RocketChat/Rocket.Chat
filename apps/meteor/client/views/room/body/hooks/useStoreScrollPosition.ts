import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject } from 'react';
import type { VirtualizerHandle } from 'virtua';

import { RoomManager } from '../../../../lib/RoomManager';

type UseStoreScrollPositionProps = {
	rid: string;
	isAtBottom: MutableRefObject<boolean>;
	virtualizerRef: MutableRefObject<VirtualizerHandle | null>;
};

export function useStoreScrollPosition({ rid, isAtBottom, virtualizerRef }: UseStoreScrollPositionProps) {
	return useDebouncedCallback(
		() => {
			const scroll = virtualizerRef.current?.scrollOffset;

			if (scroll == null) {
				return;
			}

			const store = RoomManager.getStore(rid);

			store?.update({ scroll, atBottom: isAtBottom.current });
		},
		100,
		[rid, isAtBottom, virtualizerRef],
	);
}

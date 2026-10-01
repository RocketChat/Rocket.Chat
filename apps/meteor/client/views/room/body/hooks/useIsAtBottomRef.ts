import type { RefObject } from 'react';
import { useLayoutEffect, useRef } from 'react';

import { RoomManager } from '../../../../lib/RoomManager';

/**
 * Starting from `true` makes `useKeepAtBottom` pull a restored mid-history position down to the latest messages, so seed it from the position persisted for the room being opened.
 *
 * Re-seeded on every `rid` change rather than only on mount, since the owning component isn't remounted per room switch. The reseed runs in an
 * effect rather than during render: unlike `setState`, mutating a ref's `.current` isn't undone if React discards the render that performed it.
 */
export const useIsAtBottomRef = (rid: string): RefObject<boolean> => {
	const ref = useRef<boolean>(RoomManager.getStore(rid)?.atBottom ?? true);

	useLayoutEffect(() => {
		ref.current = RoomManager.getStore(rid)?.atBottom ?? true;
	}, [rid]);

	return ref;
};

import type { RefObject } from 'react';
import { useRef } from 'react';

import { RoomManager } from '../../../../lib/RoomManager';

/**
 * Starting from `true` makes `useKeepAtBottom` pull a restored mid-history position down to the latest messages, so seed it from the position persisted for the room being opened.
 *
 * Re-seeded on every `rid` change rather than only on mount, since the owning component isn't remounted per room switch.
 */
export const useIsAtBottomRef = (rid: string): RefObject<boolean> => {
	const ref = useRef<boolean>(RoomManager.getStore(rid)?.atBottom ?? true);

	const previousRid = useRef(rid);
	if (previousRid.current !== rid) {
		previousRid.current = rid;
		ref.current = RoomManager.getStore(rid)?.atBottom ?? true;
	}

	return ref;
};

import type { RefObject } from 'react';
import { useRef } from 'react';

import { RoomManager } from '../../../../lib/RoomManager';

/** Starting from `true` makes `useKeepAtBottom` pull a restored mid-history position down to the latest messages, so seed it from the position persisted for the room being opened. */
export const useIsAtBottomRef = (rid: string): RefObject<boolean> => {
	return useRef<boolean>(RoomManager.getStore(rid)?.atBottom ?? true);
};

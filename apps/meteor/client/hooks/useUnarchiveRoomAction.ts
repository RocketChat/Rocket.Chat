import { useStableCallback } from '@rocket.chat/fuselage-hooks';

import { useArchivedRooms } from './useArchivedRooms';

/** Puts an archived room back in its own sidebar group. */
export const useUnarchiveRoomAction = ({ rid }: { rid: string }) => {
	const { unarchiveRoom } = useArchivedRooms();

	return useStableCallback(() => unarchiveRoom(rid));
};

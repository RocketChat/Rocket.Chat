import { useStableCallback } from '@rocket.chat/fuselage-hooks';

import { useArchivedRooms } from './useArchivedRooms';

/** Archives one room out of the sidebar. Nothing to confirm: unarchiving it is one click away, in the Archived group. */
export const useArchiveRoomAction = ({ rid }: { rid: string }) => {
	const { archiveRooms } = useArchivedRooms();

	return useStableCallback(() => archiveRooms([rid]));
};

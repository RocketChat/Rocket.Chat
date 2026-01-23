import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserSubscription } from '@rocket.chat/ui-contexts';

/**
 *
 * Hook to get the name of the room
 *
 * @param room - Room object
 * @returns Room name
 * @public
 *
 */
export const useRoomName = (room: IRoom) => {
	const subscription = useUserSubscription(room._id);
	const username = useUserDisplayName({ name: subscription?.fname, username: subscription?.name });

	if (isDirectMessageRoom(room)) {
		return username;
	}

	return room.fname || room.name;
};

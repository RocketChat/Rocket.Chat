import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserSubscription } from '@rocket.chat/ui-contexts';

/**
 * The room is optional because conference membership grants no room access: a member added from outside the
 * conference's room has neither the room nor a subscription to it locally, and has to be described some other way.
 */
export const useVideoConfRoomName = (room: IRoom | undefined): string | undefined => {
	const subscription = useUserSubscription(room?._id ?? '');
	const username = useUserDisplayName({ name: subscription?.fname, username: subscription?.name });

	if (!room) {
		return undefined;
	}

	return isDirectMessageRoom(room) ? username : room.fname || room.name;
};

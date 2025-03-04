import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserSubscription } from '@rocket.chat/ui-contexts';

export const useVideoConfRoomName = (room: IRoom): string | undefined => {
	const subscription = useUserSubscription(room._id);
	const username = useUserDisplayName({ name: subscription?.fname, username: subscription?.name });

	return isDirectMessageRoom(room) ? username : room.fname || room.name;
};

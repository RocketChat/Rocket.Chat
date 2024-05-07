import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';

import { useUserDisplayName } from '../../../../../hooks/useUserDisplayName';

export const useVideoConfRoomName = (room: IRoom): string | undefined => {
	const subscription = useUserSubscription(room._id);
	const username = useUserDisplayName({ name: subscription?.fname, username: subscription?.name });

	return isDirectMessageRoom(room) ? username : room.fname || room.name;
};

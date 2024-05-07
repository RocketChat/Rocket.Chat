import type { ISubscription } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';

import { useRoom } from '../../contexts/RoomContext';

export const useMessageComposerIsBlocked = ({ subscription }: { subscription?: ISubscription }): boolean => {
	const room = useRoom();

	if (!isDirectMessageRoom(room)) {
		return false;
	}
	if (!subscription) {
		return false;
	}
	// over DM's is possible to block or being blocked by the other user
	const isBlocked = Boolean(subscription.blocked);
	const isBlocker = Boolean(subscription.blocker);
	return isBlocked || isBlocker;
};

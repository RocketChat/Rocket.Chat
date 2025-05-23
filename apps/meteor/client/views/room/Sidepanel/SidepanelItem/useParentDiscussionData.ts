import { isPrivateRoom } from '@rocket.chat/core-typings';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useUserSubscription, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { useRoomInfoEndpoint } from '../../../../hooks/useRoomInfoEndpoint';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

export const useParentDiscussionData = (
	room: SubscriptionWithRoom,
): { isPending: boolean; icon?: IconName; roomName: string | null; handleRedirect: () => void } => {
	const { prid } = room;

	if (!prid) {
		throw new Error('Parent room ID is missing');
	}

	const subscription = useUserSubscription(prid);
	const { data, isPending, isError } = useRoomInfoEndpoint(prid, !subscription);

	if (!subscription) {
		if (isError || !data?.room) {
			return {
				isPending: false,
				roomName: null,
				handleRedirect: () => undefined,
			};
		}

		return {
			isPending,
			icon: isPrivateRoom(data.room) ? 'hashtag-lock' : 'hashtag',
			roomName: roomCoordinator.getRoomName(data.room.t, data.room),
			handleRedirect: (): void => data.room && roomCoordinator.openRouteLink(data.room.t, { rid: data.room._id, ...data.room }),
		};
	}

	return {
		isPending: false,
		icon: isPrivateRoom(subscription) ? 'hashtag-lock' : 'hashtag',
		roomName: roomCoordinator.getRoomName(subscription.t, subscription),
		handleRedirect: (): void => roomCoordinator.openRouteLink(subscription.t, { ...subscription }),
	};
};

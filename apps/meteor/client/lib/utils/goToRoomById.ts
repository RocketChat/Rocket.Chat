import type { IRoom } from '@rocket.chat/core-typings';
import { memoize } from '@rocket.chat/memo';

import { callWithErrorHandling } from './callWithErrorHandling';
import { router } from '../../providers/RouterProvider';
import { Subscriptions } from '../../stores';
import { roomCoordinator } from '../rooms/roomCoordinator';

const getRoomById = memoize((rid: IRoom['_id']) => callWithErrorHandling('getRoomById', rid));

type GoToRoomByIdOptions = {
	replace?: boolean;
	routeParamsOverrides?: Record<string, string>;
};

export const goToRoomById = async (roomId: IRoom['_id'], options: GoToRoomByIdOptions = {}): Promise<void> => {
	if (!roomId) return;

	const subscription = Subscriptions.state.find((record) => record.rid === roomId);

	if (subscription) {
		roomCoordinator.openRouteLink(subscription.t, subscription, router.getSearchParameters(), options);
		return;
	}

	const room = await getRoomById(roomId);
	roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room }, router.getSearchParameters(), options);
};

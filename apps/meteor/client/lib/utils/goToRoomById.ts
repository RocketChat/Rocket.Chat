import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { memoize } from '@rocket.chat/memo';

import { callWithErrorHandling } from './callWithErrorHandling';
import { Subscriptions } from '../../../app/models/client';
import { router } from '../../providers/RouterProvider';
import { roomCoordinator } from '../rooms/roomCoordinator';

const getRoomById = memoize((rid: IRoom['_id']) => callWithErrorHandling('getRoomById', rid));

export const goToRoomById = async (rid: IRoom['_id']): Promise<void> => {
	if (!rid) {
		return;
	}

	const subscription: ISubscription | undefined = Subscriptions.findOne({ rid });

	if (subscription) {
		roomCoordinator.openRouteLink(subscription.t, subscription, router.getSearchParameters());
		return;
	}

	const room = await getRoomById(rid);
	roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room }, router.getSearchParameters());
};

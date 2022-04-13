import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { memoize } from '@rocket.chat/memo';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatSubscription } from '../../../app/models/client';
import { roomCoordinator } from '../rooms/roomCoordinator';
import { callWithErrorHandling } from './callWithErrorHandling';

const getRoomById = memoize((rid: IRoom['_id']) => callWithErrorHandling('getRoomById', rid));

export const goToRoomById = async (rid: IRoom['_id']): Promise<void> => {
	if (!rid) {
		return;
	}

	const subscription: ISubscription | undefined = ChatSubscription.findOne({ rid });

	if (subscription) {
		roomCoordinator.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
		return;
	}

	const room = await getRoomById(rid);
	roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room }, FlowRouter.current().queryParams);
};

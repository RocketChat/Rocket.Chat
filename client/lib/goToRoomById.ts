import { memoize } from '@rocket.chat/memo';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatSubscription } from '../../app/models/client';
import { roomTypes } from '../../app/utils/client';
import { call } from '../../app/ui-utils/client';
import { IRoom } from '../../definition/IRoom';

const getRoomById = memoize((rid: IRoom['_id']) => call('getRoomById', rid));

export const goToRoomById = async (rid: IRoom['_id']): Promise<void> => {
	if (!rid) {
		return;
	}
	const subscription = ChatSubscription.findOne({ rid });
	if (subscription) {
		roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
		return;
	}

	const room = await getRoomById(rid);
	roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
};

import mem from 'mem';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import { ChatSubscription } from '../../../models';
import { roomTypes } from '../../../utils';
import { call } from './callMethod';

const getRoomById = mem((rid) => call('getRoomById', rid));

export const goToRoomById = async (rid) => {
	if (!rid) {
		return;
	}
	const subscription = ChatSubscription.findOne({ rid });
	if (subscription) {
		return roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	const room = await getRoomById(rid);
	return roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
};

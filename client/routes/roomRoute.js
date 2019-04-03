import mem from 'mem';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { ChatSubscription } from '../../app/models';
import { roomTypes } from '../../app/utils';
import { call } from '../../app/ui-utils';

const getRoomById = mem((rid) => call('getRoomById', rid));

FlowRouter.goToRoomById = async (rid) => {
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

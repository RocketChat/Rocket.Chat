import { FlowRouter } from 'meteor/kadira:flow-router';
import { ChatSubscription } from 'meteor/rocketchat:models';
import { roomTypes } from 'meteor/rocketchat:utils';
import { call } from 'meteor/rocketchat:ui-utils';

FlowRouter.goToRoomById = async(rid) => {
	if (!rid) {
		return;
	}
	const subscription = ChatSubscription.findOne({ rid });
	if (subscription) {
		return roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	const room = await call('getRoomById', rid);
	return roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
};

FlowRouter.goToRoomByIdWithParams = (roomId, queryParams) => {
	const subscription = ChatSubscription.findOne({ rid: roomId });
	if (subscription) {
		roomTypes.openRouteLink(subscription.t, subscription, queryParams);
	}
};

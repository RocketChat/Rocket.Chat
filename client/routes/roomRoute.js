import { FlowRouter } from 'meteor/kadira:flow-router';
import { ChatSubscription } from 'meteor/rocketchat:models';
import { roomTypes } from 'meteor/rocketchat:utils';

FlowRouter.goToRoomById = (roomId) => {
	const subscription = ChatSubscription.findOne({ rid: roomId });
	if (subscription) {
		roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}
};

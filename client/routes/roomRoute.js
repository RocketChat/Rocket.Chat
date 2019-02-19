import { FlowRouter } from 'meteor/kadira:flow-router';
import { ChatSubscription } from 'meteor/rocketchat:models';

FlowRouter.goToRoomById = (rid) => {
	const subscription = ChatSubscription.findOne({ rid });
	if (subscription) {
		RocketChat.roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}
};

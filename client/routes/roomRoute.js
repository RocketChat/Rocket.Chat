import { FlowRouter } from 'meteor/kadira:flow-router';
import { ChatSubscription } from 'meteor/rocketchat:models';
import { roomTypes } from 'meteor/rocketchat:utils';

FlowRouter.goToRoomById = (rid) => {
	const subscription = ChatSubscription.findOne({ rid });
	if (subscription) {
		roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}
};

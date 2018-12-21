import { Meteor } from 'meteor/meteor';
import { ReadReceipt } from '../../imports/message-read-receipt/server/lib/ReadReceipt';

RocketChat.readMessages = function(rid, userId) {
	// this prevents cache from updating object reference/pointer
	const userSubscription = Object.assign({}, RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, userId));

	RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId(rid, userId);

	Meteor.defer(() => {
		ReadReceipt.markMessagesAsRead(rid, userId, userSubscription.ls);
	});
};

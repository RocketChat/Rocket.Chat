import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReadReceipt } from '../../imports/message-read-receipt/server/lib/ReadReceipt';
import { Subscriptions } from 'meteor/rocketchat:models';

Meteor.methods({
	readMessages(rid) {
		check(rid, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		// this prevents cache from updating object reference/pointer
		const userSubscription = Object.assign({}, Subscriptions.findOneByRoomIdAndUserId(rid, userId));

		Subscriptions.setAsReadByRoomIdAndUserId(rid, userId);

		Meteor.defer(() => {
			ReadReceipt.markMessagesAsRead(rid, userId, userSubscription.ls);
		});
	},
});

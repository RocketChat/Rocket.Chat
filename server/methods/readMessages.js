import { ReadReceipt } from '../../imports/message-read-receipt/server/lib/ReadReceipt';

Meteor.methods({
	readMessages(rid) {
		check(rid, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages'
			});
		}

		const userSubscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, userId);

		// this prevents cache from updating object reference/pointer
		const { ls: lastSeen } = userSubscription;

		RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId(rid, userId);

		Meteor.defer(() => {
			ReadReceipt.markMessagesAsRead(rid, userId, lastSeen);
		});
	}
});

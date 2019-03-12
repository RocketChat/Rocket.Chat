import { Meteor } from 'meteor/meteor';
import { settings } from '/app/settings';
import { isTheLastMessage } from '/app/lib';
import { Subscriptions, Rooms, Messages } from '/app/models';

Meteor.methods({
	starMessage(message) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'starMessage',
			});
		}

		if (!settings.get('Message_AllowStarring')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message starring not allowed', {
				method: 'pinMessage',
				action: 'Message_starring',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}
		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());
		if (isTheLastMessage(room, message)) {
			Rooms.updateLastMessageStar(room._id, Meteor.userId(), message.starred);
		}

		return Messages.updateUserStarById(message._id, Meteor.userId(), message.starred);
	},
});

import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';
import { isTheLastMessage } from '../../lib';
import { Subscriptions, Rooms, Messages } from '../../models';

Meteor.methods({
	starMessage(message) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'starMessage',
			});
		}

		if (!settings.get('Message_AllowStarring')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message starring not allowed', {
				method: 'starMessage',
				action: 'Message_starring',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}
		if (!Messages.findOneByRoomIdAndMessageId(message.rid, message._id)) {
			return false;
		}
		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());
		if (isTheLastMessage(room, message)) {
			Rooms.updateLastMessageStar(room._id, Meteor.userId(), message.starred);
		}

		return Messages.updateUserStarById(message._id, Meteor.userId(), message.starred);
	},
});

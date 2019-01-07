import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	starMessage(message) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'starMessage',
			});
		}

		if (!RocketChat.settings.get('Message_AllowStarring')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message starring not allowed', {
				method: 'pinMessage',
				action: 'Message_starring',
			});
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}
		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());
		if (RocketChat.isTheLastMessage(room, message)) {
			RocketChat.models.Rooms.updateLastMessageStar(room._id, Meteor.userId(), message.starred);
		}

		return RocketChat.models.Messages.updateUserStarById(message._id, Meteor.userId(), message.starred);
	},
});

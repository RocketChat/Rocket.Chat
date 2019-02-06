import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:closeRoom'(roomId, comment) {
		const userId = Meteor.userId();
		if (!userId || !RocketChat.authz.hasPermission(userId, 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeRoom' });
		}

		const user = Meteor.user();

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { _id: 1 });
		if (!subscription && !RocketChat.authz.hasPermission(userId, 'close-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeRoom' });
		}

		return Livechat.closeRoom({
			user,
			room: RocketChat.models.Rooms.findOneById(roomId),
			comment,
		});
	},
});

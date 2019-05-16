import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Subscriptions, Rooms } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:closeRoom'(roomId, comment) {
		const userId = Meteor.userId();
		if (!userId || !hasPermission(userId, 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeRoom' });
		}

		const user = Meteor.user();

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { _id: 1 });
		if (!subscription && !hasPermission(userId, 'close-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeRoom' });
		}

		return Livechat.closeRoom({
			user,
			room: Rooms.findOneById(roomId),
			comment,
		});
	},
});

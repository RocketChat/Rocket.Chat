import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Subscriptions, LivechatRooms } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:closeRoom'(roomId, comment, options = {}) {
		const userId = Meteor.userId();
		if (!userId || !hasPermission(userId, 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeRoom',
			});
		}

		const room = LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:closeRoom',
			});
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:closeRoom' });
		}

		const user = Meteor.user();

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { _id: 1 });
		if (!subscription && !hasPermission(userId, 'close-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeRoom',
			});
		}

		return Livechat.closeRoom({
			user,
			room: LivechatRooms.findOneById(roomId),
			comment,
			options,
		});
	},
});

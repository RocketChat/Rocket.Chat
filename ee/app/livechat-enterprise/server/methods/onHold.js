import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	'livechat:placeChatOnHold'(roomId) {
		const userId = Meteor.userId();

		if (!userId || !hasPermission(userId, 'on-hold-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:placeChatOnHold' });
		}

		const room = LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:placeChatOnHold' });
		}

		if (room.onHold) {
			throw new Meteor.Error('room-closed', 'Room is already On-Hold', { method: 'livechat:placeChatOnHold' });
		}

		const user = Meteor.user();

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { _id: 1 });
		if (!subscription && !hasPermission(userId, 'on-hold-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:placeChatOnHold' });
		}

		return LivechatEnterprise.placeRoomOnHold(room);
	},
});

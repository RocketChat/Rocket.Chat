import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { Subscriptions, LivechatRooms } from '../../../../../app/models/server';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	'livechat:placeChatOnHold'(roomId) {
		console.log('--backend called');
		const userId = Meteor.userId();
		// TODO: create a new permission for on-hold
		if (!userId || !hasPermission(userId, 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:placeChatOnHold' });
		}


		const room = LivechatRooms.findOneById(roomId);
		console.log('--room found', room);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:placeChatOnHold' });
		}

		if (room.isChatOnHold) {
			throw new Meteor.Error('room-closed', 'Room is already On-Hold', { method: 'livechat:placeChatOnHold' });
		}

		const user = Meteor.user();

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { _id: 1 });
		if (!subscription && !hasPermission(userId, 'close-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:placeChatOnHold' });
		}

		return LivechatEnterprise.placeRoomOnHold(room._id);
	},
});

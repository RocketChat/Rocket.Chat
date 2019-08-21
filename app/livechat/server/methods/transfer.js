import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatRooms, Subscriptions, LivechatVisitors } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:transfer'(transferData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:transfer' });
		}

		check(transferData, {
			roomId: String,
			userId: Match.Optional(String),
			departmentId: Match.Optional(String),
		});

		const room = LivechatRooms.findOneById(transferData.roomId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:transfer' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription && !hasPermission(Meteor.userId(), 'transfer-livechat-guest')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:transfer' });
		}

		const guest = LivechatVisitors.findOneById(room.v && room.v._id);
		transferData.transferedBy = Meteor.userId();

		return Livechat.transfer(room, guest, transferData);
	},
});

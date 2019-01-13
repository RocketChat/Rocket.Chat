import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:transfer'(transferData) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:transfer' });
		}

		check(transferData, {
			roomId: String,
			userId: Match.Optional(String),
			departmentId: Match.Optional(String),
		});

		const room = RocketChat.models.Rooms.findOneById(transferData.roomId);

		const guest = LivechatVisitors.findOneById(room.v._id);

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, Meteor.userId(), { fields: { _id: 1 } });
		if (!subscription && !RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:transfer' });
		}

		return RocketChat.Livechat.transfer(room, guest, transferData);
	},
});

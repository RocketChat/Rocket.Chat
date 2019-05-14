import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Users, Rooms, Subscriptions, Messages } from '../../../models';
import { LivechatInquiry } from '../../lib/LivechatInquiry';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:takeInquiry'(inquiryId) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:takeInquiry' });
		}

		const inquiry = LivechatInquiry.findOneById(inquiryId);

		if (!inquiry || inquiry.status === 'taken') {
			throw new Meteor.Error('error-not-allowed', 'Inquiry already taken', { method: 'livechat:takeInquiry' });
		}

		const user = Users.findOneById(Meteor.userId());

		const agent = {
			agentId: user._id,
			username: user.username,
			ts: new Date(),
		};

		// add subscription
		const subscriptionData = {
			rid: inquiry.rid,
			name: inquiry.name,
			alert: true,
			open: true,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
			u: {
				_id: agent.agentId,
				username: agent.username,
			},
			t: 'l',
			desktopNotifications: 'all',
			mobilePushNotifications: 'all',
			emailNotifications: 'all',
		};

		Subscriptions.insert(subscriptionData);
		Rooms.incUsersCountById(inquiry.rid);

		// update room
		const room = Rooms.findOneById(inquiry.rid);

		Rooms.changeAgentByRoomId(inquiry.rid, agent);

		room.servedBy = {
			_id: agent.agentId,
			username: agent.username,
			ts: agent.ts,
		};

		// mark inquiry as taken
		LivechatInquiry.takeInquiry(inquiry._id);

		// remove sending message from guest widget
		// dont check if setting is true, because if settingwas switched off inbetween  guest entered pool,
		// and inquiry being taken, message would not be switched off.
		Messages.createCommandWithRoomIdAndUser('connected', room._id, user);

		Livechat.stream.emit(room._id, {
			type: 'agentData',
			data: Users.getAgentInfo(agent.agentId),
		});

		// return inquiry (for redirecting agent to the room route)
		return inquiry;
	},
});

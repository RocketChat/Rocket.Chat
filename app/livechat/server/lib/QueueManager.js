import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Rooms } from '../../../models/server';
import { LivechatRooms } from '../../../models';
import { createLivechatRoom, createLivechatInquiry } from './Helper';
import { LivechatInquiry } from '../../lib/LivechatInquiry';
import { callbacks } from '../../../callbacks/server';
import { RoutingManager } from './RoutingManager';
import { Livechat } from './Livechat';

export const QueueManager = {
	async requestRoom({ guest, message, roomInfo, agent }) {
		if (!Livechat.online()) {
			throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
		}

		check(message, Match.ObjectIncluding({
			rid: String,
		}));
		check(guest, Match.ObjectIncluding({
			_id: String,
			username: String,
			status: Match.Maybe(String),
			department: Match.Maybe(String),
		}));

		const { rid } = message;
		const name = (roomInfo && roomInfo.fname) || guest.name || guest.username;

		const room = Rooms.findOne(createLivechatRoom(rid, name, guest, roomInfo));
		let inquiry = LivechatInquiry.findOne(createLivechatInquiry(rid, name, guest, message));

		LivechatRooms.updateRoomCount();

		if (!agent) {
			agent = RoutingManager.getMethod().delegateAgent(agent, inquiry);
		}

		inquiry = await callbacks.run('livechat.beforeRouteChat', inquiry);
		if (inquiry.status !== 'ready') {
			return room;
		}

		callbacks.runAsync('livechat.newRoom', room);

		return RoutingManager.delegateInquiry(inquiry, agent);
	},

	init(rid, name, guest, message, roomInfo) {
		return Promise.all([
			LivechatRooms.findOne(createLivechatRoom(rid, name, guest, roomInfo)),
			LivechatInquiry.findOne(createLivechatInquiry(rid, name, guest, message)),
		]);
	},
};

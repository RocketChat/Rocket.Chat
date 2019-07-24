import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Rooms } from '../../../models';
import { createLivechatRoom, createLivechatInquiry } from './Helper';
import { LivechatInquiry } from '../../lib/LivechatInquiry';
import { callbacks } from '../../../callbacks';
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

		let room;
		let inquiry;

		await this.init(rid, name, guest, message, roomInfo)
			.then((values) => {
				room = values[0];
				inquiry = values[1];
			})
			.catch((error) => {
				console.error(error);
			});

		Rooms.updateLivechatRoomCount();

		inquiry = await callbacks.run('livechat.beforeRouteChat', inquiry);
		if (inquiry.status !== 'ready') {
			return room;
		}

		const { _id } = inquiry;
		LivechatInquiry.queueInquiry(_id);
		inquiry = LivechatInquiry.findOneById(_id);
		room = await RoutingManager.delegateInquiry(inquiry, agent);
		return room;
	},

	init(rid, name, guest, message, roomInfo) {
		return Promise.all([
			Rooms.findOne(createLivechatRoom(rid, name, guest, roomInfo)),
			LivechatInquiry.findOne(createLivechatInquiry(rid, name, guest, message)),
		]);
	},
};

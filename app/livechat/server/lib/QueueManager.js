import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { LivechatRooms, LivechatInquiry, Users } from '../../../models/server';
import { checkServiceStatus, createLivechatRoom, createLivechatInquiry } from './Helper';
import { callbacks } from '../../../callbacks/server';
import { RoutingManager } from './RoutingManager';


export const queueInquiry = async (room, inquiry, defaultAgent) => {
	const inquiryAgent = RoutingManager.delegateAgent(defaultAgent, inquiry);
	await callbacks.run('livechat.beforeRouteChat', inquiry, inquiryAgent);
	inquiry = LivechatInquiry.findOneById(inquiry._id);

	if (inquiry.status === 'ready') {
		return RoutingManager.delegateInquiry(inquiry, inquiryAgent);
	}
};
export const QueueManager = {
	async requestRoom({ guest, message, roomInfo, agent, extraData }) {
		check(message, Match.ObjectIncluding({
			rid: String,
		}));
		check(guest, Match.ObjectIncluding({
			_id: String,
			username: String,
			status: Match.Maybe(String),
			department: Match.Maybe(String),
		}));

		if (!checkServiceStatus({ guest, agent })) {
			throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
		}

		const { rid } = message;
		const name = (roomInfo && roomInfo.fname) || guest.name || guest.username;

		const room = LivechatRooms.findOneById(createLivechatRoom(rid, name, guest, roomInfo, extraData));
		const inquiry = LivechatInquiry.findOneById(createLivechatInquiry({ rid, name, guest, message, extraData }));

		LivechatRooms.updateRoomCount();

		await queueInquiry(room, inquiry, agent);

		return LivechatRooms.findOneById(rid);
	},

	async unarchiveRoom(archivedRoom = {}) {
		const { _id: rid, open, closedAt, fname: name, servedBy, v, departmentId: department, lastMessage: message } = archivedRoom;
		if (!rid || !closedAt || !!open) {
			return archivedRoom;
		}

		const oldInquiry = LivechatInquiry.findOneByRoomId(rid);
		if (oldInquiry) {
			LivechatInquiry.removeByRoomId(rid);
		}

		const guest = {
			...v,
			...department && { department },
		};

		let defaultAgent;
		if (servedBy && Users.findOneOnlineAgentByUserList(servedBy.username)) {
			defaultAgent = { agentId: servedBy._id, username: servedBy.username };
		}

		LivechatRooms.unarchiveOneById(rid);
		const room = LivechatRooms.findOneById(rid);
		const inquiry = LivechatInquiry.findOneById(createLivechatInquiry({ rid, name, guest, message }));

		await queueInquiry(room, inquiry, defaultAgent);
		return room;
	},
};

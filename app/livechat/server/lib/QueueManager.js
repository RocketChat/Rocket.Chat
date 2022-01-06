import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { LivechatRooms, LivechatInquiry, Users } from '../../../models/server';
import { checkServiceStatus, createLivechatRoom, createLivechatInquiry } from './Helper';
import { callbacks } from '../../../../lib/callbacks';
import { Logger } from '../../../logger';
import { RoutingManager } from './RoutingManager';

const logger = new Logger('QueueManager');

export const saveQueueInquiry = (inquiry) => {
	LivechatInquiry.queueInquiry(inquiry._id);
	callbacks.run('livechat.afterInquiryQueued', inquiry);
};

export const queueInquiry = async (room, inquiry, defaultAgent) => {
	const inquiryAgent = RoutingManager.delegateAgent(defaultAgent, inquiry);
	logger.debug(`Delegating inquiry with id ${inquiry._id} to agent ${defaultAgent?.username}`);

	await callbacks.run('livechat.beforeRouteChat', inquiry, inquiryAgent);
	inquiry = LivechatInquiry.findOneById(inquiry._id);

	if (inquiry.status === 'ready') {
		logger.debug(`Inquiry with id ${inquiry._id} is ready. Delegating to agent ${inquiryAgent?.username}`);
		return RoutingManager.delegateInquiry(inquiry, inquiryAgent);
	}
};

export const QueueManager = {
	async requestRoom({ guest, message, roomInfo, agent, extraData }) {
		logger.debug(`Requesting a room for guest ${guest._id}`);
		check(
			message,
			Match.ObjectIncluding({
				rid: String,
			}),
		);
		check(
			guest,
			Match.ObjectIncluding({
				_id: String,
				username: String,
				status: Match.Maybe(String),
				department: Match.Maybe(String),
			}),
		);

		if (!checkServiceStatus({ guest, agent })) {
			logger.debug(`Cannot create room for visitor ${guest._id}. No online agents`);
			throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
		}

		const { rid } = message;
		const name = (roomInfo && roomInfo.fname) || guest.name || guest.username;

		const room = LivechatRooms.findOneById(createLivechatRoom(rid, name, guest, roomInfo, extraData));
		logger.debug(`Room for visitor ${guest._id} created with id ${room._id}`);

		const inquiry = LivechatInquiry.findOneById(
			createLivechatInquiry({
				rid,
				name,
				guest,
				message,
				extraData: { ...extraData, source: roomInfo.source },
			}),
		);
		logger.debug(`Generated inquiry for visitor ${guest._id} with id ${inquiry._id} [Not queued]`);

		LivechatRooms.updateRoomCount();

		await queueInquiry(room, inquiry, agent);
		logger.debug(`Inquiry ${inquiry._id} queued`);

		return LivechatRooms.findOneById(rid);
	},

	async unarchiveRoom(archivedRoom = {}) {
		const {
			_id: rid,
			open,
			closedAt,
			fname: name,
			servedBy,
			v,
			departmentId: department,
			lastMessage: message,
			source = {},
		} = archivedRoom;

		if (!rid || !closedAt || !!open) {
			return archivedRoom;
		}

		logger.debug(`Attempting to unarchive room with id ${rid}`);

		const oldInquiry = LivechatInquiry.findOneByRoomId(rid);
		if (oldInquiry) {
			logger.debug(`Removing old inquiry (${oldInquiry._id}) for room ${rid}`);
			LivechatInquiry.removeByRoomId(rid);
		}

		const guest = {
			...v,
			...(department && { department }),
		};

		let defaultAgent;
		if (servedBy && Users.findOneOnlineAgentByUserList(servedBy.username)) {
			defaultAgent = { agentId: servedBy._id, username: servedBy.username };
		}

		LivechatRooms.unarchiveOneById(rid);
		const room = LivechatRooms.findOneById(rid);
		const inquiry = LivechatInquiry.findOneById(createLivechatInquiry({ rid, name, guest, message, extraData: { source } }));
		logger.debug(`Generated inquiry for visitor ${v._id} with id ${inquiry._id} [Not queued]`);

		await queueInquiry(room, inquiry, defaultAgent);
		logger.debug(`Inquiry ${inquiry._id} queued`);

		return room;
	},
};

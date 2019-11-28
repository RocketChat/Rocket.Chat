import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { MongoInternals } from 'meteor/mongo';

import { Messages, LivechatRooms, Rooms, Subscriptions, Users } from '../../../models/server';
import { LivechatInquiry } from '../../lib/LivechatInquiry';
import { Livechat } from './Livechat';
import { RoutingManager } from './RoutingManager';
import { callbacks } from '../../../callbacks/server';
import { settings } from '../../../settings';

export const createLivechatRoom = (rid, name, guest, extraData) => {
	check(rid, String);
	check(name, String);
	check(guest, Match.ObjectIncluding({
		_id: String,
		username: String,
		status: Match.Maybe(String),
		department: Match.Maybe(String),
	}));

	const { _id, username, token, department: departmentId, status = 'online' } = guest;

	const room = Object.assign({
		_id: rid,
		msgs: 0,
		usersCount: 1,
		lm: new Date(),
		fname: name,
		t: 'l',
		ts: new Date(),
		departmentId,
		v: {
			_id,
			username,
			token,
			status,
		},
		cl: false,
		open: true,
		waitingResponse: true,
	}, extraData);

	const roomId = Rooms.insert(room);
	callbacks.run('livechat.newRoom', room);
	return roomId;
};

export const createLivechatInquiry = (rid, name, guest, message, initialStatus) => {
	check(rid, String);
	check(name, String);
	check(guest, Match.ObjectIncluding({
		_id: String,
		username: String,
		status: Match.Maybe(String),
		department: Match.Maybe(String),
	}));
	check(message, Match.ObjectIncluding({
		msg: String,
	}));

	const { _id, username, token, department, status = 'online' } = guest;
	const { msg } = message;

	const inquiry = {
		rid,
		name,
		ts: new Date(),
		department,
		message: msg,
		status: initialStatus || 'ready',
		v: {
			_id,
			username,
			token,
			status,
		},
		t: 'l',
	};

	return LivechatInquiry.insert(inquiry);
};

export const createLivechatSubscription = (rid, name, guest, agent) => {
	check(rid, String);
	check(name, String);
	check(guest, Match.ObjectIncluding({
		_id: String,
		username: String,
		status: Match.Maybe(String),
	}));
	check(agent, Match.ObjectIncluding({
		agentId: String,
		username: String,
	}));

	const { _id, username, token, status = 'online' } = guest;

	const subscriptionData = {
		rid,
		fname: name,
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
		v: {
			_id,
			username,
			token,
			status,
		},
	};

	return Subscriptions.insert(subscriptionData);
};

export const createLivechatQueueView = () => {
	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

	mongo.db.createCollection('view_livechat_queue_status', { // name of the view to create
		viewOn: 'rocketchat_room', // name of source collection from which to create the view
		pipeline: [
			{
				$match: {
					open: true,
					servedBy: { $exists: true },
				},
			},
			{
				$group: {
					_id: '$servedBy._id',
					chats: { $sum: 1 },
				},
			},
			{
				$sort: {
					chats: 1,
				},
			},
		],
	});
};

export const removeAgentFromSubscription = (rid, { _id, username }) => {
	Subscriptions.removeByRoomIdAndUserId(rid, _id);
	Messages.createUserLeaveWithRoomIdAndUser(rid, { _id, username });
};

export const normalizeAgent = (agentId) => {
	if (!agentId) {
		return;
	}

	return settings.get('Livechat_show_agent_info') ? Users.getAgentInfo(agentId) : { hiddenInfo: true };
};

export const dispatchAgentDelegated = (rid, agentId) => {
	const agent = normalizeAgent(agentId);

	Livechat.stream.emit(rid, {
		type: 'agentData',
		data: agent,
	});
};

export const forwardRoomToAgent = async (room, transferData) => {
	if (!room || !room.open) {
		return false;
	}

	const { userId: agentId } = transferData;
	const user = Users.findOneOnlineAgentById(agentId);
	if (!user) {
		throw new Meteor.Error('error-user-is-offline', 'User is offline', { function: 'forwardRoomToAgent' });
	}

	const { _id: rid, servedBy: oldServedBy } = room;
	const inquiry = LivechatInquiry.findOneByRoomId(rid);
	if (!inquiry) {
		throw new Meteor.Error('error-invalid-inquiry', 'Invalid inquiry', { function: 'forwardRoomToAgent' });
	}

	if (oldServedBy && agentId === oldServedBy._id) {
		throw new Meteor.Error('error-selected-agent-room-agent-are-same', 'The selected agent and the room agent are the same', { function: 'forwardRoomToAgent' });
	}

	const { username } = user;
	const agent = { agentId, username };
	// There are some Enterprise features that may interrupt the fowarding process
	// Due to that we need to check whether the agent has been changed or not
	const roomTaken = await RoutingManager.takeInquiry(inquiry, agent);
	if (!roomTaken) {
		return false;
	}

	Livechat.saveTransferHistory(room, transferData);

	const { servedBy } = roomTaken;
	if (servedBy) {
		if (oldServedBy && servedBy._id !== oldServedBy._id) {
			removeAgentFromSubscription(rid, oldServedBy);
		}
		Messages.createUserJoinWithRoomIdAndUser(rid, { _id: servedBy._id, username: servedBy.username });
	}

	return true;
};

export const forwardRoomToDepartment = async (room, guest, transferData) => {
	if (!room || !room.open) {
		return false;
	}

	const { _id: rid, servedBy: oldServedBy } = room;

	const inquiry = LivechatInquiry.findOneByRoomId(rid);
	if (!inquiry) {
		throw new Meteor.Error('error-transferring-inquiry');
	}

	const { departmentId } = transferData;
	if (!RoutingManager.getConfig().autoAssignAgent) {
		Livechat.saveTransferHistory(room, transferData);
		return RoutingManager.unassignAgent(inquiry, departmentId);
	}

	// Fake the department to forward the inquiry - Case the forward process does not success
	// the inquiry will stay in the same original department
	inquiry.department = departmentId;
	const roomTaken = await RoutingManager.delegateInquiry(inquiry);
	if (!roomTaken) {
		return false;
	}

	const { servedBy } = roomTaken;
	if (oldServedBy && servedBy && oldServedBy._id === servedBy._id) {
		return false;
	}

	Livechat.saveTransferHistory(room, transferData);
	if (oldServedBy) {
		removeAgentFromSubscription(rid, oldServedBy);
	}
	if (servedBy) {
		Messages.createUserJoinWithRoomIdAndUser(rid, servedBy);
	}

	LivechatRooms.changeDepartmentIdByRoomId(rid, departmentId);
	LivechatInquiry.changeDepartmentIdByRoomId(rid, departmentId);

	const { token } = guest;
	Livechat.setDepartmentForGuest({ token, department: departmentId });

	return true;
};

export const normalizeTransferredByData = (transferredBy, room) => {
	if (!transferredBy || !room) {
		throw new Error('You must provide "transferredBy" and "room" params to "getTransferredByData"');
	}
	const { servedBy: { _id: agentId } = {} } = room;
	const { _id, username, name, userType: transferType } = transferredBy;
	const type = transferType || (_id === agentId ? 'agent' : 'user');
	return {
		_id,
		username,
		name,
		type,
	};
};

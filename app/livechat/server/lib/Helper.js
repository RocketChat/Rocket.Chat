import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { MongoInternals } from 'meteor/mongo';

import { Messages, LivechatRooms, Rooms, Subscriptions, Users } from '../../../models/server';
import { LivechatInquiry } from '../../lib/LivechatInquiry';
import { Livechat } from './Livechat';
import { RoutingManager } from './RoutingManager';

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

	return Rooms.insert(room);
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

export const dispatchAgentDelegated = (rid, agentId) => {
	const agent = agentId && Users.getAgentInfo(agentId);
	Livechat.stream.emit(rid, {
		type: 'agentData',
		data: agent,
	});
};

export const forwardRoomToAgent = async (room, agentId) => {
	const user = Users.findOneOnlineAgentById(agentId);
	if (!user) {
		return false;
	}

	const { _id: rid, servedBy: oldServedBy } = room;
	const inquiry = LivechatInquiry.findOneByRoomId(rid);
	if (!inquiry) {
		throw new Meteor.Error('error-transferring-inquiry');
	}


	const { username } = user;
	const agent = { agentId, username };

	if (oldServedBy && agent.agentId !== oldServedBy._id) {
		// There are some Enterprise features that may interrupt the fowarding process
		// Due to that we need to check whether the agent has been changed or not
		const room = await RoutingManager.takeInquiry(inquiry, agent);
		if (!room) {
			return false;
		}

		const { servedBy } = room;
		if (servedBy && servedBy._id !== oldServedBy._id) {
			Subscriptions.removeByRoomIdAndUserId(rid, oldServedBy._id);
			Messages.createUserLeaveWithRoomIdAndUser(rid, { _id: oldServedBy._id, username: oldServedBy.username });
			Messages.createUserJoinWithRoomIdAndUser(rid, { _id: agent.agentId, username });
			return true;
		}
	}

	return false;
};

export const forwardRoomToDepartment = async (room, guest, departmentId) => {
	const { _id: rid, servedBy: oldServedBy } = room;

	const inquiry = LivechatInquiry.findOneByRoomId(rid);
	if (!inquiry) {
		throw new Meteor.Error('error-transferring-inquiry');
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return RoutingManager.unassignAgent(inquiry, departmentId);
	}

	// Fake the department to forward the inquiry - Case the forward process does not success
	// the inquiry will stay in the same original department
	inquiry.department = departmentId;
	room = await RoutingManager.delegateInquiry(inquiry);
	if (!room) {
		return false;
	}

	const { servedBy } = room;
	// if there was an agent assigned to the chat and there is no new agent assigned
	// or the new agent is not the same, then the fowarding process successed
	if (oldServedBy && (!servedBy || oldServedBy._id !== servedBy._id)) {
		Subscriptions.removeByRoomIdAndUserId(rid, oldServedBy._id);
		Messages.createUserLeaveWithRoomIdAndUser(rid, { _id: oldServedBy._id, username: oldServedBy.username });
		LivechatRooms.changeDepartmentIdByRoomId(rid, departmentId);
		LivechatInquiry.changeDepartmentIdByRoomId(rid, departmentId);
		// Update the visitor's department
		const { token } = guest;
		Livechat.setDepartmentForGuest({ token, department: departmentId });

		if (servedBy) {
			const { _id, username } = servedBy;
			Messages.createUserJoinWithRoomIdAndUser(rid, { _id, username });
		}

		return true;
	}

	return false;
};

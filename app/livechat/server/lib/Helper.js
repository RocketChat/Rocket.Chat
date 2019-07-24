import { Match, check } from 'meteor/check';
import { MongoInternals } from 'meteor/mongo';

import { Rooms, Subscriptions, Users } from '../../../models';
import { LivechatInquiry } from '../../lib/LivechatInquiry';
import { Livechat } from './Livechat';

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
	const agent = Users.getAgentInfo(agentId);
	Livechat.stream.emit(rid, {
		type: 'agentData',
		data: agent,
	});
};

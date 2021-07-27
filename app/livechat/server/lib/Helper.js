import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Match, check } from 'meteor/check';
import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';

import { hasRole } from '../../../authorization';
import { Messages, LivechatRooms, Rooms, Subscriptions, Users, LivechatInquiry, LivechatDepartment, LivechatDepartmentAgents } from '../../../models/server';
import { Livechat } from './Livechat';
import { RoutingManager } from './RoutingManager';
import { callbacks } from '../../../callbacks/server';
import { settings } from '../../../settings';
import { Apps, AppEvents } from '../../../apps/server';
import notifications from '../../../notifications/server/lib/Notifications';
import { sendNotification } from '../../../lib/server';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { queueInquiry } from './QueueManager';

export const allowAgentSkipQueue = (agent) => {
	check(agent, Match.ObjectIncluding({
		agentId: String,
	}));

	return hasRole(agent.agentId, 'bot');
};

export const createLivechatRoom = (rid, name, guest, roomInfo = {}, extraData = {}) => {
	check(rid, String);
	check(name, String);
	check(guest, Match.ObjectIncluding({
		_id: String,
		username: String,
		status: Match.Maybe(String),
		department: Match.Maybe(String),
	}));

	const extraRoomInfo = callbacks.run('livechat.beforeRoom', roomInfo, extraData);
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
	}, extraRoomInfo);

	const roomId = Rooms.insert(room);

	Meteor.defer(() => {
		Apps.triggerEvent(AppEvents.IPostLivechatRoomStarted, room);
		callbacks.run('livechat.newRoom', room);
	});

	sendMessage(guest, { t: 'livechat-started', msg: '', groupable: false }, room);

	return roomId;
};

export const createLivechatInquiry = ({ rid, name, guest, message, initialStatus, extraData = {} }) => {
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

	const extraInquiryInfo = callbacks.run('livechat.beforeInquiry', extraData);

	const { _id, username, token, department, status = 'online' } = guest;
	const { msg } = message;
	const ts = new Date();

	const inquiry = Object.assign({
		rid,
		name,
		ts,
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
		queueOrder: 1,
		estimatedWaitingTimeQueue: 0,
		estimatedServiceTimeAt: ts,
	}, extraInquiryInfo);

	return LivechatInquiry.insert(inquiry);
};

export const createLivechatSubscription = (rid, name, guest, agent, department) => {
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

	const existingSubscription = Subscriptions.findOneByRoomIdAndUserId(rid, agent.agentId);
	if (existingSubscription?._id) {
		return existingSubscription;
	}

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
		...department && { department },
	};

	return Subscriptions.insert(subscriptionData);
};

export const removeAgentFromSubscription = (rid, { _id, username }) => {
	const room = LivechatRooms.findOneById(rid);
	const user = Users.findOneById(_id);

	Subscriptions.removeByRoomIdAndUserId(rid, _id);
	Messages.createUserLeaveWithRoomIdAndUser(rid, { _id, username });

	Meteor.defer(() => {
		Apps.triggerEvent(AppEvents.IPostLivechatAgentUnassigned, { room, user });
	});
};

export const parseAgentCustomFields = (customFields) => {
	if (!customFields) {
		return;
	}

	const externalCustomFields = () => {
		const accountCustomFields = settings.get('Accounts_CustomFields');
		if (!accountCustomFields || accountCustomFields.trim() === '') {
			return [];
		}

		try {
			const parseCustomFields = JSON.parse(accountCustomFields);
			return Object.keys(parseCustomFields)
				.filter((customFieldKey) => parseCustomFields[customFieldKey].sendToIntegrations === true);
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	const externalCF = externalCustomFields();
	return Object.keys(customFields).reduce((newObj, key) => (externalCF.includes(key) ? { ...newObj, [key]: customFields[key] } : newObj), null);
};

export const normalizeAgent = (agentId) => {
	if (!agentId) {
		return;
	}

	if (!settings.get('Livechat_show_agent_info')) {
		return { hiddenInfo: true };
	}

	const agent = Users.getAgentInfo(agentId);
	const { customFields: agentCustomFields, ...extraData } = agent;
	const customFields = parseAgentCustomFields(agentCustomFields);

	return Object.assign(extraData, { ...customFields && { customFields } });
};

export const dispatchAgentDelegated = (rid, agentId) => {
	const agent = normalizeAgent(agentId);

	notifications.streamLivechatRoom.emit(rid, {
		type: 'agentData',
		data: agent,
	});
};

export const dispatchInquiryQueued = (inquiry, agent) => {
	if (!inquiry?._id) {
		return;
	}

	const { department, rid, v } = inquiry;
	const room = LivechatRooms.findOneById(rid);
	Meteor.defer(() => callbacks.run('livechat.chatQueued', room));

	if (RoutingManager.getConfig().autoAssignAgent) {
		return;
	}

	if (!agent || !allowAgentSkipQueue(agent)) {
		LivechatInquiry.queueInquiry(inquiry._id);
	}

	// Alert only the online agents of the queued request
	const onlineAgents = Livechat.getOnlineAgents(department, agent);

	const notificationUserName = v && (v.name || v.username);

	onlineAgents.forEach((agent) => {
		if (agent.agentId) {
			agent = Users.findOneById(agent.agentId);
		}
		const { _id, active, emails, language, status, statusConnection, username } = agent;
		sendNotification({
			// fake a subscription in order to make use of the function defined above
			subscription: {
				rid,
				t: 'l',
				u: {
					_id,
				},
				receiver: [{
					active,
					emails,
					language,
					status,
					statusConnection,
					username,
				}],
			},
			sender: v,
			hasMentionToAll: true, // consider all agents to be in the room
			hasMentionToHere: false,
			message: Object.assign({}, { u: v }),
			notificationMessage: TAPi18n.__('User_started_a_new_conversation', { username: notificationUserName }, language),
			room: Object.assign(room, { name: TAPi18n.__('New_chat_in_queue', {}, language) }),
			mentionIds: [],
		});
	});
};

export const forwardRoomToAgent = async (room, transferData) => {
	if (!room || !room.open) {
		return false;
	}

	const { userId: agentId, clientAction } = transferData;
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
	// Remove department from inquiry to make sure the routing algorithm treat this as forwarding to agent and not as forwarding to department
	inquiry.department = undefined;
	// There are some Enterprise features that may interrupt the forwarding process
	// Due to that we need to check whether the agent has been changed or not
	const roomTaken = await RoutingManager.takeInquiry(inquiry, agent, { ...clientAction && { clientAction } });
	if (!roomTaken) {
		return false;
	}

	Livechat.saveTransferHistory(room, transferData);

	const { servedBy } = roomTaken;
	if (servedBy) {
		if (oldServedBy && servedBy._id !== oldServedBy._id) {
			RoutingManager.removeAllRoomSubscriptions(room, servedBy);
		}
		Messages.createUserJoinWithRoomIdAndUser(rid, { _id: servedBy._id, username: servedBy.username });

		Meteor.defer(() => {
			Apps.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
				type: LivechatTransferEventType.AGENT,
				room: rid,
				from: oldServedBy?._id,
				to: servedBy._id,
			});
		});
	}

	callbacks.run('livechat.afterForwardChatToAgent', { rid, servedBy, oldServedBy });
	return true;
};

export const updateChatDepartment = ({ rid, newDepartmentId, oldDepartmentId }) => {
	LivechatRooms.changeDepartmentIdByRoomId(rid, newDepartmentId);
	LivechatInquiry.changeDepartmentIdByRoomId(rid, newDepartmentId);
	Subscriptions.changeDepartmentByRoomId(rid, newDepartmentId);

	Meteor.defer(() => {
		Apps.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
			type: LivechatTransferEventType.DEPARTMENT,
			room: rid,
			from: oldDepartmentId,
			to: newDepartmentId,
		});
	});

	return callbacks.run('livechat.afterForwardChatToDepartment', { rid, newDepartmentId, oldDepartmentId });
};

export const forwardRoomToDepartment = async (room, guest, transferData) => {
	if (!room || !room.open) {
		return false;
	}
	callbacks.run('livechat.beforeForwardRoomToDepartment', { room, transferData });
	const { _id: rid, servedBy: oldServedBy, departmentId: oldDepartmentId } = room;
	let agent = null;

	const inquiry = LivechatInquiry.findOneByRoomId(rid);
	if (!inquiry) {
		throw new Meteor.Error('error-transferring-inquiry');
	}

	const { departmentId } = transferData;
	if (oldDepartmentId === departmentId) {
		throw new Meteor.Error('error-forwarding-chat-same-department', 'The selected department and the current room department are the same', { function: 'forwardRoomToDepartment' });
	}

	const { userId: agentId, clientAction } = transferData;
	if (agentId) {
		let user = Users.findOneOnlineAgentById(agentId);
		if (!user) {
			throw new Meteor.Error('error-user-is-offline', 'User is offline', { function: 'forwardRoomToAgent' });
		}
		user = LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(agentId, departmentId);
		if (!user) {
			throw new Meteor.Error('error-user-not-belong-to-department', 'The selected user does not belong to this department', { function: 'forwardRoomToDepartment' });
		}
		const { username } = user;
		agent = { agentId, username };
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		Livechat.saveTransferHistory(room, transferData);
		return RoutingManager.unassignAgent(inquiry, departmentId);
	}

	// Fake the department to forward the inquiry - Case the forward process does not success
	// the inquiry will stay in the same original department
	inquiry.department = departmentId;
	const roomTaken = await RoutingManager.delegateInquiry(inquiry, agent, { forwardingToDepartment: { oldDepartmentId }, ...clientAction && { clientAction } });
	if (!roomTaken) {
		return false;
	}

	const { servedBy, chatQueued } = roomTaken;
	if (!chatQueued && oldServedBy && servedBy && oldServedBy._id === servedBy._id) {
		return false;
	}

	Livechat.saveTransferHistory(room, transferData);
	if (oldServedBy) {
		RoutingManager.removeAllRoomSubscriptions(room, servedBy);
	}
	if (!chatQueued && servedBy) {
		Messages.createUserJoinWithRoomIdAndUser(rid, servedBy);
	}

	updateChatDepartment({ rid, newDepartmentId: departmentId, oldDepartmentId });

	if (chatQueued) {
		LivechatInquiry.readyInquiry(inquiry._id);
		const newInquiry = LivechatInquiry.findOneById(inquiry._id);
		await queueInquiry(room, newInquiry);
	}

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
		...name && { name },
		type,
	};
};

export const checkServiceStatus = ({ guest, agent }) => {
	if (!agent) {
		return Livechat.online(guest.department);
	}

	const { agentId } = agent;
	const users = Users.findOnlineAgents(agentId);
	return users && users.count() > 0;
};

export const userCanTakeInquiry = (user) => {
	check(user, Match.ObjectIncluding({
		status: String,
		statusLivechat: String,
		roles: [String],
	}));

	const { roles, status, statusLivechat } = user;
	// TODO: hasRole when the user has already been fetched from DB
	return (status !== 'offline' && statusLivechat === 'available') || roles.includes('bot');
};

export const updateDepartmentAgents = (departmentId, agents, departmentEnabled) => {
	check(departmentId, String);
	check(agents, Match.ObjectIncluding({
		upsert: Match.Maybe(Array),
		remove: Match.Maybe(Array),
	}));

	const { upsert = [], remove = [] } = agents;
	const agentsRemoved = [];
	const agentsAdded = [];
	remove.forEach(({ agentId }) => {
		LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(departmentId, agentId);
		agentsRemoved.push(agentId);
	});

	if (agentsRemoved.length > 0) {
		callbacks.runAsync('livechat.removeAgentDepartment', { departmentId, agentsId: agentsRemoved });
	}

	upsert.forEach((agent) => {
		if (!Users.findOneById(agent.agentId, { fields: { _id: 1 } })) {
			return;
		}

		LivechatDepartmentAgents.saveAgent({
			agentId: agent.agentId,
			departmentId,
			username: agent.username,
			count: agent.count ? parseInt(agent.count) : 0,
			order: agent.order ? parseInt(agent.order) : 0,
			departmentEnabled,
		});
		agentsAdded.push(agent.agentId);
	});

	if (agentsAdded.length > 0) {
		callbacks.runAsync('livechat.saveAgentDepartment', {
			departmentId,
			agentsId: agentsAdded,
		});
	}

	if (agentsRemoved.length > 0 || agentsAdded.length > 0) {
		const numAgents = LivechatDepartmentAgents.find({ departmentId }).count();
		LivechatDepartment.updateNumAgentsById(departmentId, numAgents);
	}

	return true;
};

import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';
import { api, Message } from '@rocket.chat/core-services';
import { OmnichannelSourceType, DEFAULT_SLA_CONFIG } from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings/src/ILivechatPriority';
import { Logger } from '@rocket.chat/logger';
import {
	LivechatDepartmentAgents,
	LivechatInquiry,
	LivechatRooms,
	LivechatDepartment,
	Subscriptions,
	Rooms,
	Users,
} from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { Apps, AppEvents } from '../../../../ee/server/apps';
import { callbacks } from '../../../../lib/callbacks';
import { validateEmail as validatorFunc } from '../../../../lib/emailValidator';
import { i18n } from '../../../../server/lib/i18n';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { sendNotification } from '../../../lib/server';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { settings } from '../../../settings/server';
import { Livechat } from './Livechat';
import { Livechat as LivechatTyped } from './LivechatTyped';
import { queueInquiry, saveQueueInquiry } from './QueueManager';
import { RoutingManager } from './RoutingManager';

const logger = new Logger('LivechatHelper');

export const allowAgentSkipQueue = (agent) => {
	check(
		agent,
		Match.ObjectIncluding({
			agentId: String,
		}),
	);

	return hasRoleAsync(agent.agentId, 'bot');
};

export const createLivechatRoom = async (rid, name, guest, roomInfo = {}, extraData = {}) => {
	check(rid, String);
	check(name, String);
	check(
		guest,
		Match.ObjectIncluding({
			_id: String,
			username: String,
			status: Match.Maybe(String),
			department: Match.Maybe(String),
		}),
	);

	const extraRoomInfo = await callbacks.run('livechat.beforeRoom', roomInfo, extraData);
	const { _id, username, token, department: departmentId, status = 'online' } = guest;
	const newRoomAt = new Date();

	logger.debug(`Creating livechat room for visitor ${_id}`);

	const room = Object.assign(
		{
			_id: rid,
			msgs: 0,
			usersCount: 1,
			lm: newRoomAt,
			fname: name,
			t: 'l',
			ts: newRoomAt,
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
			// this should be overriden by extraRoomInfo when provided
			// in case it's not provided, we'll use this "default" type
			source: {
				type: OmnichannelSourceType.OTHER,
				alias: 'unknown',
			},
			queuedAt: newRoomAt,

			priorityWeight: LivechatPriorityWeight.NOT_SPECIFIED,
			estimatedWaitingTimeQueue: DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,
		},
		extraRoomInfo,
	);

	const roomId = (await Rooms.insertOne(room)).insertedId;

	Apps.triggerEvent(AppEvents.IPostLivechatRoomStarted, room);
	await callbacks.run('livechat.newRoom', room);

	await sendMessage(guest, { t: 'livechat-started', msg: '', groupable: false }, room);

	return roomId;
};

export const createLivechatInquiry = async ({ rid, name, guest, message, initialStatus, extraData = {} }) => {
	check(rid, String);
	check(name, String);
	check(
		guest,
		Match.ObjectIncluding({
			_id: String,
			username: String,
			status: Match.Maybe(String),
			department: Match.Maybe(String),
		}),
	);
	check(
		message,
		Match.ObjectIncluding({
			msg: String,
		}),
	);

	const extraInquiryInfo = await callbacks.run('livechat.beforeInquiry', extraData);

	const { _id, username, token, department, status = 'online' } = guest;
	const { msg } = message;
	const ts = new Date();

	logger.debug(`Creating livechat inquiry for visitor ${_id}`);

	const inquiry = {
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
		priorityWeight: LivechatPriorityWeight.NOT_SPECIFIED,
		estimatedWaitingTimeQueue: DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,

		...extraInquiryInfo,
	};

	const result = (await LivechatInquiry.insertOne(inquiry)).insertedId;
	logger.debug(`Inquiry ${result} created for visitor ${_id}`);

	return result;
};

export const createLivechatSubscription = async (rid, name, guest, agent, department) => {
	check(rid, String);
	check(name, String);
	check(
		guest,
		Match.ObjectIncluding({
			_id: String,
			username: String,
			status: Match.Maybe(String),
		}),
	);
	check(
		agent,
		Match.ObjectIncluding({
			agentId: String,
			username: String,
		}),
	);

	const existingSubscription = await Subscriptions.findOneByRoomIdAndUserId(rid, agent.agentId);
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
		...(department && { department }),
	};

	return Subscriptions.insertOne(subscriptionData);
};

export const removeAgentFromSubscription = async (rid, { _id, username }) => {
	const room = await LivechatRooms.findOneById(rid);
	const user = await Users.findOneById(_id);

	await Subscriptions.removeByRoomIdAndUserId(rid, _id);
	await Message.saveSystemMessage('ul', rid, username, { _id: user._id, username: user.username, name: user.name });

	setImmediate(() => {
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
			return Object.keys(parseCustomFields).filter((customFieldKey) => parseCustomFields[customFieldKey].sendToIntegrations === true);
		} catch (error) {
			Livechat.logger.error(error);
			return [];
		}
	};

	const externalCF = externalCustomFields();
	return Object.keys(customFields).reduce(
		(newObj, key) => (externalCF.includes(key) ? { ...newObj, [key]: customFields[key] } : newObj),
		null,
	);
};

export const normalizeAgent = async (agentId) => {
	if (!agentId) {
		return;
	}

	if (!settings.get('Livechat_show_agent_info')) {
		return { hiddenInfo: true };
	}

	const agent = await Users.getAgentInfo(agentId, settings.get('Livechat_show_agent_email'));
	const { customFields: agentCustomFields, ...extraData } = agent;
	const customFields = parseAgentCustomFields(agentCustomFields);

	return Object.assign(extraData, { ...(customFields && { customFields }) });
};

export const dispatchAgentDelegated = async (rid, agentId) => {
	const agent = await normalizeAgent(agentId);

	void api.broadcast('omnichannel.room', rid, {
		type: 'agentData',
		data: agent,
	});
};

export const dispatchInquiryQueued = async (inquiry, agent) => {
	if (!inquiry?._id) {
		return;
	}
	logger.debug(`Notifying agents of new inquiry ${inquiry._id} queued`);

	const { department, rid, v } = inquiry;
	const room = await LivechatRooms.findOneById(rid);
	setImmediate(() => callbacks.run('livechat.chatQueued', room));

	if (RoutingManager.getConfig().autoAssignAgent) {
		return;
	}

	if (!agent || !(await allowAgentSkipQueue(agent))) {
		await saveQueueInquiry(inquiry);
	}

	// Alert only the online agents of the queued request
	const onlineAgents = await LivechatTyped.getOnlineAgents(department, agent);
	if (!onlineAgents) {
		logger.debug('Cannot notify agents of queued inquiry. No online agents found');
		return;
	}

	logger.debug(`Notifying ${await onlineAgents.count()} agents of new inquiry`);
	const notificationUserName = v && (v.name || v.username);

	for await (const agent of onlineAgents) {
		const { _id, active, emails, language, status, statusConnection, username } = agent;
		await sendNotification({
			// fake a subscription in order to make use of the function defined above
			subscription: {
				rid,
				t: 'l',
				u: {
					_id,
				},
				receiver: [
					{
						active,
						emails,
						language,
						status,
						statusConnection,
						username,
					},
				],
			},
			sender: v,
			hasMentionToAll: true, // consider all agents to be in the room
			hasMentionToHere: false,
			message: Object.assign({}, { u: v }),
			// we should use server's language for this type of messages instead of user's
			notificationMessage: i18n.t('User_started_a_new_conversation', { username: notificationUserName }, language),
			room: Object.assign(room, { name: i18n.t('New_chat_in_queue', {}, language) }),
			mentionIds: [],
		});
	}
};

export const forwardRoomToAgent = async (room, transferData) => {
	if (!room || !room.open) {
		return false;
	}

	logger.debug(`Forwarding room ${room._id} to agent ${transferData.userId}`);

	const { userId: agentId, clientAction } = transferData;
	const user = await Users.findOneOnlineAgentById(agentId);
	if (!user) {
		logger.debug(`Agent ${agentId} is offline. Cannot forward`);
		throw new Error('error-user-is-offline');
	}

	const { _id: rid, servedBy: oldServedBy } = room;
	const inquiry = await LivechatInquiry.findOneByRoomId(rid);
	if (!inquiry) {
		logger.debug(`No inquiries found for room ${room._id}. Cannot forward`);
		throw new Error('error-invalid-inquiry');
	}

	if (oldServedBy && agentId === oldServedBy._id) {
		throw new Error('error-selected-agent-room-agent-are-same');
	}

	const { username } = user;
	const agent = { agentId, username };
	// Remove department from inquiry to make sure the routing algorithm treat this as forwarding to agent and not as forwarding to department
	inquiry.department = undefined;
	// There are some Enterprise features that may interrupt the forwarding process
	// Due to that we need to check whether the agent has been changed or not
	logger.debug(`Forwarding inquiry ${inquiry._id} to agent ${agent._id}`);
	const roomTaken = await RoutingManager.takeInquiry(inquiry, agent, {
		...(clientAction && { clientAction }),
	});
	if (!roomTaken) {
		logger.debug(`Cannot forward inquiry ${inquiry._id}`);
		return false;
	}

	await Livechat.saveTransferHistory(room, transferData);

	const { servedBy } = roomTaken;
	if (servedBy) {
		if (oldServedBy && servedBy._id !== oldServedBy._id) {
			await RoutingManager.removeAllRoomSubscriptions(room, servedBy);
		}

		setImmediate(() => {
			Apps.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
				type: LivechatTransferEventType.AGENT,
				room: rid,
				from: oldServedBy?._id,
				to: servedBy._id,
			});
		});
	}

	logger.debug(`Inquiry ${inquiry._id} taken by agent ${agent._id}`);
	await callbacks.run('livechat.afterForwardChatToAgent', { rid, servedBy, oldServedBy });
	return true;
};

export const updateChatDepartment = async ({ rid, newDepartmentId, oldDepartmentId }) => {
	await LivechatRooms.changeDepartmentIdByRoomId(rid, newDepartmentId);
	await LivechatInquiry.changeDepartmentIdByRoomId(rid, newDepartmentId);
	await Subscriptions.changeDepartmentByRoomId(rid, newDepartmentId);

	setImmediate(() => {
		Apps.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
			type: LivechatTransferEventType.DEPARTMENT,
			room: rid,
			from: oldDepartmentId,
			to: newDepartmentId,
		});
	});

	return callbacks.run('livechat.afterForwardChatToDepartment', {
		rid,
		newDepartmentId,
		oldDepartmentId,
	});
};

export const forwardRoomToDepartment = async (room, guest, transferData) => {
	if (!room || !room.open) {
		return false;
	}
	logger.debug(`Attempting to forward room ${room._id} to department ${transferData.departmentId}`);

	await callbacks.run('livechat.beforeForwardRoomToDepartment', { room, transferData });
	const { _id: rid, servedBy: oldServedBy, departmentId: oldDepartmentId } = room;
	let agent = null;

	const inquiry = await LivechatInquiry.findOneByRoomId(rid);
	if (!inquiry) {
		logger.debug(`Cannot forward room ${room._id}. No inquiries found`);
		throw new Error('error-transferring-inquiry');
	}

	const { departmentId } = transferData;
	if (oldDepartmentId === departmentId) {
		throw new Error('error-forwarding-chat-same-department');
	}

	const { userId: agentId, clientAction } = transferData;
	if (agentId) {
		logger.debug(`Forwarding room ${room._id} to department ${departmentId} (to user ${agentId})`);
		let user = await Users.findOneOnlineAgentById(agentId);
		if (!user) {
			throw new Error('error-user-is-offline');
		}
		user = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(agentId, departmentId);
		if (!user) {
			throw new Error('error-user-not-belong-to-department');
		}
		const { username } = user;
		agent = { agentId, username };
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		logger.debug(
			`Routing algorithm doesn't support auto assignment (using ${RoutingManager.methodName}). Chat will be on department queue`,
		);
		await Livechat.saveTransferHistory(room, transferData);
		return RoutingManager.unassignAgent(inquiry, departmentId);
	}

	// Fake the department to forward the inquiry - Case the forward process does not success
	// the inquiry will stay in the same original department
	inquiry.department = departmentId;
	const roomTaken = await RoutingManager.delegateInquiry(inquiry, agent, {
		forwardingToDepartment: { oldDepartmentId },
		...(clientAction && { clientAction }),
	});
	if (!roomTaken) {
		logger.debug(`Cannot forward room ${room._id}. Unable to delegate inquiry`);
		return false;
	}

	const { servedBy, chatQueued } = roomTaken;
	if (!chatQueued && oldServedBy && servedBy && oldServedBy._id === servedBy._id) {
		const department = await LivechatDepartment.findOneById(departmentId);
		if (!department?.fallbackForwardDepartment?.length) {
			logger.debug(`Cannot forward room ${room._id}. Chat assigned to agent ${servedBy._id} (Previous was ${oldServedBy._id})`);
			throw new Error('error-no-agents-online-in-department');
		}
		// if a chat has a fallback department, attempt to redirect chat to there [EE]
		return !!callbacks.run('livechat:onTransferFailure', { room, guest, transferData });
	}

	await Livechat.saveTransferHistory(room, transferData);
	if (oldServedBy) {
		// if chat is queued then we don't ignore the new servedBy agent bcs at this
		// point the chat is not assigned to him/her and it is still in the queue
		await RoutingManager.removeAllRoomSubscriptions(room, !chatQueued && servedBy);
	}
	if (!chatQueued && servedBy) {
		await Message.saveSystemMessage('uj', rid, servedBy.username, servedBy);
	}

	await updateChatDepartment({ rid, newDepartmentId: departmentId, oldDepartmentId });

	if (chatQueued) {
		logger.debug(`Forwarding succesful. Marking inquiry ${inquiry._id} as ready`);
		await LivechatInquiry.readyInquiry(inquiry._id);
		await LivechatRooms.removeAgentByRoomId(rid);
		await dispatchAgentDelegated(rid, null);
		const newInquiry = await LivechatInquiry.findOneById(inquiry._id);
		await queueInquiry(newInquiry);

		logger.debug(`Inquiry ${inquiry._id} queued succesfully`);
	}

	const { token } = guest;
	await LivechatTyped.setDepartmentForGuest({ token, department: departmentId });
	logger.debug(`Department for visitor with token ${token} was updated to ${departmentId}`);

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
		...(name && { name }),
		type,
	};
};

export const checkServiceStatus = async ({ guest, agent }) => {
	if (!agent) {
		return LivechatTyped.online(guest.department);
	}

	const { agentId } = agent;
	const users = await Users.countOnlineAgents(agentId);
	return users > 0;
};

export const updateDepartmentAgents = async (departmentId, agents, departmentEnabled) => {
	check(departmentId, String);
	check(
		agents,
		Match.ObjectIncluding({
			upsert: Match.Maybe(Array),
			remove: Match.Maybe(Array),
		}),
	);

	const { upsert = [], remove = [] } = agents;
	const agentsRemoved = [];
	const agentsAdded = [];
	for await (const { agentId } of remove) {
		await LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(departmentId, agentId);
		agentsRemoved.push(agentId);
	}

	if (agentsRemoved.length > 0) {
		callbacks.runAsync('livechat.removeAgentDepartment', { departmentId, agentsId: agentsRemoved });
	}

	for await (const agent of upsert) {
		const agentFromDb = await Users.findOneById(agent.agentId, { projection: { _id: 1, username: 1 } });
		if (!agentFromDb) {
			continue;
		}

		await LivechatDepartmentAgents.saveAgent({
			agentId: agent.agentId,
			departmentId,
			username: agentFromDb.username,
			count: agent.count ? parseInt(agent.count) : 0,
			order: agent.order ? parseInt(agent.order) : 0,
			departmentEnabled,
		});
		agentsAdded.push(agent.agentId);
	}

	if (agentsAdded.length > 0) {
		callbacks.runAsync('livechat.saveAgentDepartment', {
			departmentId,
			agentsId: agentsAdded,
		});
	}

	if (agentsRemoved.length > 0 || agentsAdded.length > 0) {
		const numAgents = await LivechatDepartmentAgents.countByDepartmentId(departmentId);
		await LivechatDepartment.updateNumAgentsById(departmentId, numAgents);
	}

	return true;
};

export const validateEmail = (email) => {
	if (!validatorFunc(email)) {
		throw new Meteor.Error('error-invalid-email', `Invalid email ${email}`, {
			function: 'Livechat.validateEmail',
			email,
		});
	}
	return true;
};

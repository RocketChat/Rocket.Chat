import { Apps, AppEvents } from '@rocket.chat/apps';
import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';
import { api, Message, Omnichannel } from '@rocket.chat/core-services';
import type {
	ILivechatVisitor,
	IOmnichannelRoom,
	IMessage,
	SelectedAgent,
	ISubscription,
	ILivechatInquiryRecord,
	IUser,
	TransferData,
	ILivechatDepartmentAgents,
	TransferByData,
	ILivechatAgent,
	ILivechatDepartment,
} from '@rocket.chat/core-typings';
import { LivechatInquiryStatus, OmnichannelSourceType, DEFAULT_SLA_CONFIG, UserStatus } from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings/src/ILivechatPriority';
import { Logger } from '@rocket.chat/logger';
import type { InsertionModel } from '@rocket.chat/model-typings';
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

import { callbacks } from '../../../../lib/callbacks';
import { validateEmail as validatorFunc } from '../../../../lib/emailValidator';
import { i18n } from '../../../../server/lib/i18n';
import { OmnichannelQueue } from '../../../../server/services/omnichannel/queue';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { sendNotification } from '../../../lib/server';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { settings } from '../../../settings/server';
import { Livechat as LivechatTyped } from './LivechatTyped';
import { queueInquiry, saveQueueInquiry } from './QueueManager';
import { RoutingManager } from './RoutingManager';

const logger = new Logger('LivechatHelper');
export const allowAgentSkipQueue = (agent: SelectedAgent) => {
	check(
		agent,
		Match.ObjectIncluding({
			agentId: String,
		}),
	);

	return hasRoleAsync(agent.agentId, 'bot');
};
export const createLivechatRoom = async (
	rid: string,
	name: string,
	guest: ILivechatVisitor,
	roomInfo: Partial<IOmnichannelRoom> = {},
	extraData = {},
) => {
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

	const { activity } = guest;
	logger.debug({
		msg: `Creating livechat room for visitor ${_id}`,
		visitor: { _id, username, departmentId, status, activity },
	});

	const room: InsertionModel<IOmnichannelRoom> = Object.assign(
		{
			_id: rid,
			msgs: 0,
			usersCount: 1,
			lm: newRoomAt,
			fname: name,
			t: 'l' as const,
			ts: newRoomAt,
			departmentId,
			v: {
				_id,
				username,
				token,
				status,
				...(activity?.length && { activity }),
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

	await callbacks.run('livechat.newRoom', room);

	await sendMessage(guest, { t: 'livechat-started', msg: '', groupable: false }, room);

	return roomId;
};

export const createLivechatInquiry = async ({
	rid,
	name,
	guest,
	message,
	initialStatus,
	extraData,
}: {
	rid: string;
	name?: string;
	guest?: Pick<ILivechatVisitor, '_id' | 'username' | 'status' | 'department' | 'name' | 'token' | 'activity'>;
	message?: Pick<IMessage, 'msg'>;
	initialStatus?: LivechatInquiryStatus;
	extraData?: Pick<ILivechatInquiryRecord, 'source'>;
}) => {
	check(rid, String);
	check(name, String);
	check(
		guest,
		Match.ObjectIncluding({
			_id: String,
			username: String,
			status: Match.Maybe(String),
			department: Match.Maybe(String),
			activity: Match.Maybe([String]),
		}),
	);
	check(
		message,
		Match.ObjectIncluding({
			msg: String,
		}),
	);

	const extraInquiryInfo = await callbacks.run('livechat.beforeInquiry', extraData);

	const { _id, username, token, department, status = UserStatus.ONLINE, activity } = guest;
	const { msg } = message;
	const ts = new Date();

	logger.debug({
		msg: `Creating livechat inquiry for visitor ${_id}`,
		visitor: { _id, username, department, status, activity },
	});

	const inquiry: InsertionModel<ILivechatInquiryRecord> = {
		rid,
		name,
		ts,
		department,
		message: msg,
		status: initialStatus || LivechatInquiryStatus.READY,
		v: {
			_id,
			username,
			token,
			status,
			...(activity?.length && { activity }),
		},
		t: 'l',
		priorityWeight: LivechatPriorityWeight.NOT_SPECIFIED,
		estimatedWaitingTimeQueue: DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,

		...extraInquiryInfo,
	};

	const result = (await LivechatInquiry.insertOne(inquiry)).insertedId;
	logger.debug(`Inquiry ${result} created for visitor ${_id}`);

	void OmnichannelQueue.execute();
	return result;
};

export const createLivechatSubscription = async (
	rid: string,
	name: string,
	guest: Pick<ILivechatVisitor, '_id' | 'username' | 'status' | 'name' | 'token' | 'phone'>,
	agent: SelectedAgent,
	department?: string,
) => {
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

	const { _id, username, token, status = UserStatus.ONLINE } = guest;

	const subscriptionData: InsertionModel<ISubscription> = {
		rid,
		name,
		fname: name,
		lowerCaseName: name.toLowerCase(),
		lowerCaseFName: name.toLowerCase(),
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
		ts: new Date(),
		...(department && { department }),
	} as InsertionModel<ISubscription>;

	return Subscriptions.insertOne(subscriptionData);
};

export const removeAgentFromSubscription = async (rid: string, { _id, username }: Pick<IUser, '_id' | 'username'>) => {
	const room = await LivechatRooms.findOneById(rid);
	const user = await Users.findOneById(_id);

	if (!room || !user) {
		return;
	}

	await Subscriptions.removeByRoomIdAndUserId(rid, _id);
	await Message.saveSystemMessage('ul', rid, username || '', { _id: user._id, username: user.username, name: user.name });

	setImmediate(() => {
		void Apps.self?.triggerEvent(AppEvents.IPostLivechatAgentUnassigned, { room, user });
	});
};

export const parseAgentCustomFields = (customFields?: Record<string, any>) => {
	if (!customFields) {
		return;
	}

	const externalCustomFields = () => {
		const accountCustomFields = settings.get<string>('Accounts_CustomFields');
		if (!accountCustomFields || accountCustomFields.trim() === '') {
			return [];
		}

		try {
			const parseCustomFields = JSON.parse(accountCustomFields);
			return Object.keys(parseCustomFields).filter((customFieldKey) => parseCustomFields[customFieldKey].sendToIntegrations === true);
		} catch (error) {
			logger.error(error);
			return [];
		}
	};

	const externalCF = externalCustomFields();
	return Object.keys(customFields).reduce(
		(newObj, key) => (externalCF.includes(key) ? { ...newObj, [key]: customFields[key] } : newObj),
		{},
	);
};

export const normalizeAgent = async (agentId?: string) => {
	if (!agentId) {
		return;
	}

	if (!settings.get('Livechat_show_agent_info')) {
		return { hiddenInfo: true };
	}

	const agent = await Users.getAgentInfo(agentId, settings.get('Livechat_show_agent_email'));
	if (!agent) {
		return;
	}

	const { customFields: agentCustomFields, ...extraData } = agent;
	const customFields = parseAgentCustomFields(agentCustomFields);

	return Object.assign(extraData, { ...(customFields && { customFields }) }) as ILivechatAgent;
};

export const dispatchAgentDelegated = async (rid: string, agentId?: string) => {
	const agent = await normalizeAgent(agentId);

	void api.broadcast('omnichannel.room', rid, {
		type: 'agentData',
		data: agent,
	});
};

export const dispatchInquiryQueued = async (inquiry: ILivechatInquiryRecord, agent?: SelectedAgent | null) => {
	if (!inquiry?._id) {
		return;
	}
	logger.debug(`Notifying agents of new inquiry ${inquiry._id} queued`);

	const { department, rid, v } = inquiry;
	const room = await LivechatRooms.findOneById(rid);
	if (!room) {
		return;
	}

	setImmediate(() => callbacks.run('livechat.chatQueued', room));

	if (RoutingManager.getConfig()?.autoAssignAgent) {
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
				name: '',
			},
			sender: v,
			hasMentionToAll: true, // consider all agents to be in the room
			hasReplyToThread: false,
			disableAllMessageNotifications: false,
			hasMentionToHere: false,
			message: { _id: '', u: v, msg: '' },
			// we should use server's language for this type of messages instead of user's
			notificationMessage: i18n.t('User_started_a_new_conversation', { username: notificationUserName }, language),
			room: Object.assign(room, { name: i18n.t('New_chat_in_queue', {}, language) }),
			mentionIds: [],
		});
	}
};

export const forwardRoomToAgent = async (room: IOmnichannelRoom, transferData: TransferData) => {
	if (!room?.open) {
		return false;
	}

	logger.debug(`Forwarding room ${room._id} to agent ${transferData.userId}`);

	const { userId: agentId, clientAction } = transferData;
	if (!agentId) {
		throw new Error('error-invalid-agent');
	}
	const user = await Users.findOneOnlineAgentById(agentId);
	if (!user) {
		logger.debug(`Agent ${agentId} is offline. Cannot forward`);
		throw new Error('error-user-is-offline');
	}

	const { _id: rid, servedBy: oldServedBy } = room;
	const inquiry = await LivechatInquiry.findOneByRoomId(rid, {});
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
	delete inquiry.department;
	// There are some Enterprise features that may interrupt the forwarding process
	// Due to that we need to check whether the agent has been changed or not
	logger.debug(`Forwarding inquiry ${inquiry._id} to agent ${agent.agentId}`);
	const roomTaken = await RoutingManager.takeInquiry(inquiry, agent, {
		...(clientAction && { clientAction }),
	});
	if (!roomTaken) {
		logger.debug(`Cannot forward inquiry ${inquiry._id}`);
		return false;
	}

	await LivechatTyped.saveTransferHistory(room, transferData);

	const { servedBy } = roomTaken;
	if (servedBy) {
		if (oldServedBy && servedBy._id !== oldServedBy._id) {
			await RoutingManager.removeAllRoomSubscriptions(room, servedBy);
		}

		setImmediate(() => {
			void Apps.self?.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
				type: LivechatTransferEventType.AGENT,
				room: rid,
				from: oldServedBy?._id,
				to: servedBy._id,
			});
		});
	}

	logger.debug(`Inquiry ${inquiry._id} taken by agent ${agent.agentId}`);
	await callbacks.run('livechat.afterForwardChatToAgent', { rid, servedBy, oldServedBy });
	return true;
};

export const updateChatDepartment = async ({
	rid,
	newDepartmentId,
	oldDepartmentId,
}: {
	rid: string;
	newDepartmentId: string;
	oldDepartmentId?: string;
}) => {
	await Promise.all([
		LivechatRooms.changeDepartmentIdByRoomId(rid, newDepartmentId),
		LivechatInquiry.changeDepartmentIdByRoomId(rid, newDepartmentId),
		Subscriptions.changeDepartmentByRoomId(rid, newDepartmentId),
	]);

	setImmediate(() => {
		void Apps.self?.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
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

export const forwardRoomToDepartment = async (room: IOmnichannelRoom, guest: ILivechatVisitor, transferData: TransferData) => {
	if (!room?.open) {
		return false;
	}
	logger.debug(`Attempting to forward room ${room._id} to department ${transferData.departmentId}`);

	await callbacks.run('livechat.beforeForwardRoomToDepartment', { room, transferData });
	const { _id: rid, servedBy: oldServedBy, departmentId: oldDepartmentId } = room;
	let agent = null;

	const inquiry = await LivechatInquiry.findOneByRoomId(rid, {});
	if (!inquiry) {
		logger.debug(`Cannot forward room ${room._id}. No inquiries found`);
		throw new Error('error-transferring-inquiry');
	}

	const { departmentId } = transferData;
	if (!departmentId) {
		logger.debug(`Cannot forward room ${room._id}. No departmentId provided`);
		throw new Error('error-transferring-inquiry-no-department');
	}
	if (oldDepartmentId === departmentId) {
		throw new Error('error-forwarding-chat-same-department');
	}

	const { userId: agentId, clientAction } = transferData;
	if (agentId) {
		logger.debug(`Forwarding room ${room._id} to department ${departmentId} (to user ${agentId})`);
		const user = await Users.findOneOnlineAgentById(agentId);
		if (!user) {
			throw new Error('error-user-is-offline');
		}
		const isInDepartment = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(agentId, departmentId, {
			projection: { _id: 1 },
		});
		if (!isInDepartment) {
			throw new Error('error-user-not-belong-to-department');
		}
		const { username } = user;
		agent = { agentId, username };
	}

	const department = await LivechatDepartment.findOneById<
		Pick<ILivechatDepartment, 'allowReceiveForwardOffline' | 'fallbackForwardDepartment' | 'name'>
	>(departmentId, {
		projection: {
			allowReceiveForwardOffline: 1,
			fallbackForwardDepartment: 1,
			name: 1,
		},
	});

	if (
		!RoutingManager.getConfig()?.autoAssignAgent ||
		!(await Omnichannel.isWithinMACLimit(room)) ||
		(department?.allowReceiveForwardOffline && !(await LivechatTyped.checkOnlineAgents(departmentId)))
	) {
		logger.debug(`Room ${room._id} will be on department queue`);
		await LivechatTyped.saveTransferHistory(room, transferData);
		return RoutingManager.unassignAgent(inquiry, departmentId, true);
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
		if (!department?.fallbackForwardDepartment?.length) {
			logger.debug(`Cannot forward room ${room._id}. Chat assigned to agent ${servedBy._id} (Previous was ${oldServedBy._id})`);
			throw new Error('error-no-agents-online-in-department');
		}

		if (!transferData.originalDepartmentName) {
			transferData.originalDepartmentName = department.name;
		}
		// if a chat has a fallback department, attempt to redirect chat to there [EE]
		const transferSuccess = !!(await callbacks.run('livechat:onTransferFailure', room, { guest, transferData, department }));
		// On CE theres no callback so it will return the room
		if (typeof transferSuccess !== 'boolean' || !transferSuccess) {
			logger.debug(`Cannot forward room ${room._id}. Unable to delegate inquiry`);
			return false;
		}

		return true;
	}

	// Send just 1 message to the room to inform the user that the chat was transferred
	if (transferData.usingFallbackDep) {
		const { _id, username } = transferData.transferredBy;
		await Message.saveSystemMessage(
			'livechat_transfer_history_fallback',
			room._id,
			'',
			{ _id, username },
			{
				transferData: {
					...transferData,
					prevDepartment: transferData.originalDepartmentName,
				},
			},
		);
	}

	await LivechatTyped.saveTransferHistory(room, transferData);
	if (oldServedBy) {
		// if chat is queued then we don't ignore the new servedBy agent bcs at this
		// point the chat is not assigned to him/her and it is still in the queue
		await RoutingManager.removeAllRoomSubscriptions(room, !chatQueued ? servedBy : undefined);
	}

	await updateChatDepartment({ rid, newDepartmentId: departmentId, oldDepartmentId });

	if (chatQueued) {
		logger.debug(`Forwarding succesful. Marking inquiry ${inquiry._id} as ready`);
		await LivechatInquiry.readyInquiry(inquiry._id);
		await LivechatRooms.removeAgentByRoomId(rid);
		await dispatchAgentDelegated(rid);
		const newInquiry = await LivechatInquiry.findOneById(inquiry._id);
		if (!newInquiry) {
			logger.debug(`Inquiry ${inquiry._id} not found`);
			throw new Error('error-invalid-inquiry');
		}

		await queueInquiry(newInquiry);
		logger.debug(`Inquiry ${inquiry._id} queued succesfully`);
	}

	return true;
};

export const normalizeTransferredByData = (transferredBy: TransferByData, room: IOmnichannelRoom) => {
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

export const checkServiceStatus = async ({ guest, agent }: { guest: Pick<ILivechatVisitor, 'department'>; agent?: SelectedAgent }) => {
	if (!agent) {
		return LivechatTyped.online(guest.department);
	}

	const { agentId } = agent;
	const users = await Users.countOnlineAgents(agentId);
	return users > 0;
};

const parseFromIntOrStr = (value: string | number) => {
	if (typeof value === 'number') {
		return value;
	}
	return parseInt(value);
};

export const updateDepartmentAgents = async (
	departmentId: string,
	agents: {
		upsert?: Pick<ILivechatDepartmentAgents, 'agentId' | 'count' | 'order'>[];
		remove?: Pick<ILivechatDepartmentAgents, 'agentId'>[];
	},
	departmentEnabled: boolean,
) => {
	check(departmentId, String);
	check(agents, {
		upsert: Match.Maybe([
			Match.ObjectIncluding({
				agentId: String,
				username: Match.Maybe(String),
				count: Match.Maybe(Match.Integer),
				order: Match.Maybe(Match.Integer),
			}),
		]),
		remove: Match.Maybe([
			Match.ObjectIncluding({
				agentId: String,
				username: Match.Maybe(String),
				count: Match.Maybe(Match.Integer),
				order: Match.Maybe(Match.Integer),
			}),
		]),
	});

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
			username: agentFromDb.username || '',
			count: agent.count ? parseFromIntOrStr(agent.count) : 0,
			order: agent.order ? parseFromIntOrStr(agent.order) : 0,
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

export const validateEmail = (email: string) => {
	if (!validatorFunc(email)) {
		throw new Meteor.Error('error-invalid-email', `Invalid email ${email}`, {
			function: 'Livechat.validateEmail',
			email,
		});
	}
	return true;
};

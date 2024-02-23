import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';
import { api, Message } from '@rocket.chat/core-services';
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
	IRoom,
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

import { Apps, AppEvents } from '../../../../ee/server/apps';
import { callbacks } from '../../../../lib/callbacks';
import { validateEmail as validatorFunc } from '../../../../lib/emailValidator';
import { i18n } from '../../../../server/lib/i18n';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { sendNotification } from '../../../lib/server';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { settings } from '../../../settings/server';
import { Livechat as LivechatTyped } from './LivechatTyped';
import { saveQueueInquiry } from './QueueManager';
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

	void Apps.triggerEvent(AppEvents.IPostLivechatRoomStarted, room);
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
		void Apps.triggerEvent(AppEvents.IPostLivechatAgentUnassigned, { room, user });
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
	const allowOfflineAgents = Boolean(settings.get('Livechat_allow_forward_inquiry_to_offline_department_agents'));

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

	if (!agent || !(await allowAgentSkipQueue(agent))) {
		await saveQueueInquiry(inquiry);
	}

	if (agent && allowOfflineAgents) {
		const livechatAgent = await LivechatTyped.getAgentById(agent.agentId);

		if (!livechatAgent) {
			return;
		}

		await Promise.all([saveQueueInquiry(inquiry), sendMessageToAgent(livechatAgent, room, v)]);
		return;
	}

	// Alert only the online agents of the queued request
	const onlineAgents = await LivechatTyped.getOnlineAgents(department, agent);
	if (!onlineAgents) {
		logger.debug('Cannot notify agents of queued inquiry. No online agents found');
		return;
	}

	logger.debug(`Notifying ${await onlineAgents.count()} agents of new inquiry`);

	const sendMessageToOnlineAgent = onlineAgents.map(async (agent) => sendMessageToAgent(agent, room, v));
	await Promise.all([sendMessageToOnlineAgent]);
};

const sendMessageToAgent = async (agent: ILivechatAgent, room: IRoom, visitor: ILivechatInquiryRecord['v']) => {
	const { _id, active, emails, language, status, statusConnection, username } = agent;
	const notificationUserName = visitor && (visitor.name || visitor.username);
	return sendNotification({
		// fake a subscription in order to make use of the function defined above
		subscription: {
			rid: room._id,
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
		sender: visitor,
		hasMentionToAll: true, // consider all agents to be in the room
		hasReplyToThread: false,
		disableAllMessageNotifications: false,
		hasMentionToHere: false,
		message: { _id: '', u: visitor, msg: '' },
		// we should use server's language for this type of messages instead of user's
		notificationMessage: i18n.t('User_started_a_new_conversation', { username: notificationUserName }, language),
		room: Object.assign(room, { name: i18n.t('New_chat_in_queue', {}, language) }),
		mentionIds: [],
	});
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
		void Apps.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
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

export const checkDepartmentBeforeTakeInquiry = (roomId: string, departmentId?: string, oldDepartmentId?: string) => {
	if (!departmentId) {
		logger.debug(`Cannot forward room ${roomId}. No departmentId provided`);
		throw new Error('error-transferring-inquiry-no-department');
	}

	if (!oldDepartmentId) {
		logger.debug(`Cannot forward room ${roomId}. No departmentId provided`);
		throw new Error('error-transferring-inquiry-no-department');
	}
	if (oldDepartmentId === departmentId) {
		throw new Error('error-forwarding-chat-same-department');
	}

	return {
		departmentId,
		oldDepartmentId,
	};
};

export const retrieveInquiry = async (roomId: string) => {
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId, {});
	if (!inquiry) {
		logger.debug(`Cannot forward room ${roomId}. No inquiries found`);
		throw new Error('error-transferring-inquiry');
	}

	return inquiry;
};

export const setInquiryToDepartment = async (
	inquiry: ILivechatInquiryRecord,
	transferData: TransferData,
	room: IOmnichannelRoom,
	newDepartmentId?: string,
	agent?: SelectedAgent,
) => {
	await Promise.all([
		LivechatTyped.saveTransferHistory(room, transferData),
		setImmediate(() => {
			void Apps.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
				type: LivechatTransferEventType.AGENT,
				room: room._id,
				from: transferData.transferredBy,
				to: transferData.transferredTo,
			});
		}),
		RoutingManager.unassignAgent(inquiry, newDepartmentId, agent),
	]);

	return true;
};

export const setInquiryToAgent = async (inquiry: ILivechatInquiryRecord, agent: SelectedAgent) => {
	const room = await LivechatRooms.findOneById(inquiry.rid);

	logger.debug(`Removing assignations of inquiry ${inquiry._id}`);
	if (!room?.open) {
		logger.debug(`Cannot unassign agent from inquiry ${inquiry._id}: Room already closed`);
		return false;
	}

	return Promise.all([
		LivechatRooms.removeAgentByRoomId(inquiry.rid),
		RoutingManager.removeAllRoomSubscriptions(room),
		dispatchAgentDelegated(inquiry.rid),
		RoutingManager.assignAgent(inquiry, agent),
	]);
};

export const checkIfThereAreOnlineAgentsInDepartment = async (departmentId: string) => {
	const onlineAgents = await LivechatTyped.getOnlineAgents(departmentId);
	if (!onlineAgents) {
		throw new Error('no online agents');
	}

	return true;
};

export const getAgent = async (agentId: string, allowOfflineAgents: boolean) => {
	return allowOfflineAgents ? Users.findOneAgentById(agentId, {}) : Users.findOneOnlineAgentById(agentId);
};

export const forwardRoomToDepartment = async (room: IOmnichannelRoom, transferData: TransferData) => {
	await callbacks.run('livechat.beforeForwardRoomToDepartment', { room, transferData });

	const { departmentId } = checkDepartmentBeforeTakeInquiry(room._id, transferData.departmentId, room.departmentId);
	const inquiry = await retrieveInquiry(room._id);
	const allowOfflineDepartments = Boolean(settings.get('Livechat_allow_forward_inquiry_to_offline_department_agents'));

	const agent = transferData.userId ? await getAgent(transferData.userId, allowOfflineDepartments) : undefined;
	let selectedAgent: SelectedAgent | undefined;
	if (agent) {
		selectedAgent = {
			agentId: agent._id,
			username: agent.username,
		};
	}

	if (allowOfflineDepartments) {
		return setInquiryToDepartment(inquiry, transferData, room, departmentId, selectedAgent);
	}

	if (!(await checkIfThereAreOnlineAgentsInDepartment(departmentId))) {
		throw new Error('error-no-agents-online-in-department');
	}

	return setInquiryToDepartment(inquiry, transferData, room, departmentId, selectedAgent);
};

export const forwardRoomToAgent = async (room: IOmnichannelRoom, transferData: TransferData): Promise<boolean> => {
	if (!room?.open) {
		return false;
	}

	logger.debug(`Forwarding room ${room._id} to agent ${transferData.userId}`);

	if (!transferData.userId) {
		throw new Error('error-invalid-agent');
	}

	const inquiry = await LivechatInquiry.findOneByRoomId(room._id, {});
	if (!inquiry) {
		logger.debug(`No inquiries found for room ${room._id}. Cannot forward`);
		throw new Error('error-invalid-inquiry');
	}

	const allowOfflineAgents = Boolean(settings.get('Livechat_allow_forward_inquiry_to_offline_department_agents'));
	const agent = await getAgent(transferData.userId, allowOfflineAgents);
	if (!agent) {
		logger.debug(`Agent ${transferData.userId} is offline. Cannot forward`);
		throw new Error('error-user-is-offline');
	}

	await Promise.all([
		setInquiryToAgent(inquiry, { ...agent, agentId: transferData.userId }),

		LivechatTyped.saveTransferHistory(room, transferData),

		setImmediate(() => {
			void Apps.triggerEvent(AppEvents.IPostLivechatRoomTransferred, {
				type: LivechatTransferEventType.AGENT,
				room: room._id,
				from: transferData.transferredBy,
				to: transferData.transferredTo,
			});
		}),
		callbacks.run('livechat.afterForwardChatToAgent', {
			rid: room._id,
			servedBy: transferData.transferredBy,
			oldServedBy: transferData.transferredTo,
		}),
	]);

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

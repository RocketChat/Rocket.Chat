import { Apps, AppEvents } from '@rocket.chat/apps';
import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';
import { api, Message, Omnichannel } from '@rocket.chat/core-services';
import type {
	ILivechatVisitor,
	IOmnichannelRoom,
	SelectedAgent,
	ISubscription,
	ILivechatInquiryRecord,
	IUser,
	TransferData,
	ILivechatDepartmentAgents,
	TransferByData,
	ILivechatAgent,
	ILivechatDepartment,
	IOmnichannelRoomInfo,
	IOmnichannelInquiryExtraData,
	IOmnichannelRoomExtraData,
	ILivechatContact,
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
	Users,
	LivechatContacts,
} from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';
import { ObjectId } from 'mongodb';

import { queueInquiry, saveQueueInquiry } from './QueueManager';
import { RoutingManager } from './RoutingManager';
import { isVerifiedChannelInSource } from './contacts/isVerifiedChannelInSource';
import { migrateVisitorIfMissingContact } from './contacts/migrateVisitorIfMissingContact';
import { checkOnlineAgents, getOnlineAgents } from './service-status';
import { saveTransferHistory } from './transfer';
import { callbacks } from '../../../../lib/callbacks';
import { validateEmail as validatorFunc } from '../../../../lib/emailValidator';
import { i18n } from '../../../../server/lib/i18n';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { sendNotification } from '../../../lib/server';
import {
	notifyOnLivechatDepartmentAgentChanged,
	notifyOnLivechatDepartmentAgentChangedByAgentsAndDepartmentId,
	notifyOnSubscriptionChangedById,
	notifyOnSubscriptionChangedByRoomId,
	notifyOnSubscriptionChanged,
} from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';

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
export const prepareLivechatRoom = async (
	rid: string,
	guest: ILivechatVisitor,
	roomInfo: IOmnichannelRoomInfo = { source: { type: OmnichannelSourceType.OTHER } },
	extraData?: IOmnichannelRoomExtraData,
): Promise<InsertionModel<IOmnichannelRoom>> => {
	check(rid, String);
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
	const source = extraRoomInfo.source || roomInfo.source;

	if (settings.get<string>('Livechat_Require_Contact_Verification') === 'always') {
		await LivechatContacts.setChannelVerifiedStatus({ visitorId: _id, source }, false);
	}

	const contactId = await migrateVisitorIfMissingContact(_id, source);
	const contact =
		contactId &&
		(await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'name' | 'channels' | 'activity'>>(contactId, {
			projection: { name: 1, channels: 1, activity: 1 },
		}));
	if (!contact) {
		throw new Error('error-invalid-contact');
	}
	const verified = Boolean(contact.channels.some((channel) => isVerifiedChannelInSource(channel, _id, source)));

	const activity = guest.activity || contact.activity;
	logger.debug({
		msg: `Creating livechat room for visitor ${_id}`,
		visitor: { _id, username, departmentId, status, activity },
	});

	// TODO: Solve `u` missing issue
	return {
		_id: rid,
		msgs: 0,
		usersCount: 1,
		lm: newRoomAt,
		fname: contact.name,
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
		contactId,
		cl: false,
		open: true,
		waitingResponse: true,
		verified,
		// this should be overridden by extraRoomInfo when provided
		// in case it's not provided, we'll use this "default" type
		source: {
			type: OmnichannelSourceType.OTHER,
			alias: 'unknown',
		},
		queuedAt: newRoomAt,
		priorityWeight: LivechatPriorityWeight.NOT_SPECIFIED,
		estimatedWaitingTimeQueue: DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,
		...extraRoomInfo,
	} as InsertionModel<IOmnichannelRoom>;
};

export const createLivechatRoom = async (room: InsertionModel<IOmnichannelRoom>, session: ClientSession) => {
	const result = await LivechatRooms.findOneAndUpdate(
		removeEmpty(room),
		{
			$set: {},
		},
		{
			upsert: true,
			returnDocument: 'after',
			session,
		},
	);

	if (!result) {
		throw new Error('Room not created');
	}

	return result;
};

export const createLivechatInquiry = async ({
	rid,
	name,
	guest,
	message,
	initialStatus,
	extraData,
	session,
}: {
	rid: string;
	name?: string;
	guest?: Pick<ILivechatVisitor, '_id' | 'username' | 'status' | 'department' | 'name' | 'token' | 'activity'>;
	message?: string;
	initialStatus?: LivechatInquiryStatus;
	extraData?: IOmnichannelInquiryExtraData;
	session?: ClientSession;
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

	const extraInquiryInfo = await callbacks.run('livechat.beforeInquiry', extraData);

	const { _id, username, token, department, status = UserStatus.ONLINE } = guest;
	const inquirySource = extraData?.source || { type: OmnichannelSourceType.OTHER };
	const activity =
		guest.activity ||
		(await LivechatContacts.findOneByVisitor({ visitorId: guest._id, source: inquirySource }, { projection: { activity: 1 } }))?.activity;

	const ts = new Date();

	logger.debug({
		msg: `Creating livechat inquiry for visitor`,
		visitor: { _id, username, department, status, activity },
	});

	const result = await LivechatInquiry.findOneAndUpdate(
		removeEmpty({
			rid,
			name,
			ts,
			department,
			message: message ?? '',
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
		}),
		{
			$set: {
				_id: new ObjectId().toHexString(),
			},
		},
		{
			upsert: true,
			returnDocument: 'after',
			session,
		},
	);
	logger.debug(`Inquiry ${result} created for visitor ${_id}`);

	if (!result) {
		throw new Error('Inquiry not created');
	}

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

	const response = await Subscriptions.insertOne(subscriptionData);

	if (response?.insertedId) {
		void notifyOnSubscriptionChangedById(response.insertedId, 'inserted');
	}

	return response;
};

export const removeAgentFromSubscription = async (rid: string, { _id, username }: Pick<IUser, '_id' | 'username'>) => {
	const room = await LivechatRooms.findOneById(rid);
	const user = await Users.findOneById(_id);

	if (!room || !user) {
		return;
	}

	const deletedSubscription = await Subscriptions.removeByRoomIdAndUserId(rid, _id);
	if (deletedSubscription) {
		void notifyOnSubscriptionChanged(deletedSubscription, 'removed');
	}

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

/**
 * @deprecated
 */

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

	if (agent && (await allowAgentSkipQueue(agent))) {
		return;
	}

	await saveQueueInquiry(inquiry);

	// Alert only the online agents of the queued request
	const onlineAgents = await getOnlineAgents(department, agent);
	if (!onlineAgents) {
		logger.debug('Cannot notify agents of queued inquiry. No online agents found');
		return;
	}

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
			notificationMessage: i18n.t('User_started_a_new_conversation', { username: notificationUserName, lng: language }),
			room: Object.assign(room, { name: i18n.t('New_chat_in_queue', { lng: language }) }),
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
	const roomTaken = await RoutingManager.takeInquiry(
		inquiry,
		agent,
		{
			...(clientAction && { clientAction }),
		},
		room,
	);
	if (!roomTaken) {
		logger.debug(`Cannot forward inquiry ${inquiry._id}`);
		return false;
	}

	await saveTransferHistory(room, transferData);

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
	const responses = await Promise.all([
		LivechatRooms.changeDepartmentIdByRoomId(rid, newDepartmentId),
		LivechatInquiry.changeDepartmentIdByRoomId(rid, newDepartmentId),
		Subscriptions.changeDepartmentByRoomId(rid, newDepartmentId),
	]);

	if (responses[2].modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

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
		(department?.allowReceiveForwardOffline && !(await checkOnlineAgents(departmentId)))
	) {
		logger.debug(`Room ${room._id} will be on department queue`);
		await saveTransferHistory(room, transferData);
		return RoutingManager.unassignAgent(inquiry, departmentId, true);
	}

	// Fake the department to forward the inquiry - Case the forward process does not success
	// the inquiry will stay in the same original department
	inquiry.department = departmentId;
	const roomTaken = await RoutingManager.delegateInquiry(
		inquiry,
		agent,
		{
			forwardingToDepartment: { oldDepartmentId },
			...(clientAction && { clientAction }),
		},
		room,
	);
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
				...(transferData.transferredBy.userType === 'visitor' && { token: room.v.token }),
				transferData: {
					...transferData,
					prevDepartment: transferData.originalDepartmentName,
				},
			},
		);
	}

	await saveTransferHistory(room, transferData);
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

type MakePropertyOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };

export const normalizeTransferredByData = (
	transferredBy: MakePropertyOptional<TransferByData, 'userType'>,
	room: IOmnichannelRoom,
): TransferByData => {
	if (!transferredBy || !room) {
		throw new Error('You must provide "transferredBy" and "room" params to "getTransferredByData"');
	}
	const { servedBy: { _id: agentId } = {} } = room;
	const { _id, username, name, userType: transferType } = transferredBy;
	const userType = transferType || (_id === agentId ? 'agent' : 'user');
	return {
		_id,
		username,
		...(name && { name }),
		userType,
	};
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

	const agentsUpdated = [];
	const agentsRemoved = remove.map(({ agentId }: { agentId: string }) => agentId);
	const agentsAdded = [];

	if (agentsRemoved.length > 0) {
		const removedIds = await LivechatDepartmentAgents.findByAgentsAndDepartmentId(agentsRemoved, departmentId, {
			projection: { agentId: 1 },
		}).toArray();

		const { deletedCount } = await LivechatDepartmentAgents.removeByIds(removedIds.map(({ _id }) => _id));

		if (deletedCount > 0) {
			removedIds.forEach(({ _id, agentId }) => {
				void notifyOnLivechatDepartmentAgentChanged(
					{
						_id,
						agentId,
						departmentId,
					},
					'removed',
				);
			});
		}

		callbacks.runAsync('livechat.removeAgentDepartment', { departmentId, agentsId: agentsRemoved });
	}

	for await (const agent of upsert) {
		const agentFromDb = await Users.findOneById(agent.agentId, { projection: { _id: 1, username: 1 } });
		if (!agentFromDb) {
			continue;
		}

		const livechatDepartmentAgent = await LivechatDepartmentAgents.saveAgent({
			agentId: agent.agentId,
			departmentId,
			username: agentFromDb.username || '',
			count: agent.count ? parseFromIntOrStr(agent.count) : 0,
			order: agent.order ? parseFromIntOrStr(agent.order) : 0,
			departmentEnabled,
		});

		if (livechatDepartmentAgent.upsertedId) {
			void notifyOnLivechatDepartmentAgentChanged(
				{
					_id: livechatDepartmentAgent.upsertedId as any,
					agentId: agent.agentId,
					departmentId,
				},
				'inserted',
			);
		} else {
			agentsUpdated.push(agent.agentId);
		}

		agentsAdded.push(agent.agentId);
	}

	if (agentsAdded.length > 0) {
		callbacks.runAsync('livechat.saveAgentDepartment', {
			departmentId,
			agentsId: agentsAdded,
		});
	}

	if (agentsUpdated.length > 0) {
		void notifyOnLivechatDepartmentAgentChangedByAgentsAndDepartmentId(agentsUpdated, departmentId);
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

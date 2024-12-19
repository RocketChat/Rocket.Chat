import { Apps, AppEvents } from '@rocket.chat/apps';
import { Message, VideoConf, api, Omnichannel } from '@rocket.chat/core-services';
import type {
	IOmnichannelRoom,
	IOmnichannelRoomClosingInfo,
	IUser,
	ILivechatVisitor,
	SelectedAgent,
	ILivechatAgent,
	IMessage,
	ILivechatDepartment,
	AtLeast,
	TransferData,
	IOmnichannelAgent,
	ILivechatInquiryRecord,
	UserStatus,
	IOmnichannelRoomInfo,
	IOmnichannelRoomExtraData,
	IOmnichannelSource,
	ILivechatContactVisitorAssociation,
} from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Logger, type MainLogger } from '@rocket.chat/logger';
import {
	LivechatDepartment,
	LivechatInquiry,
	LivechatRooms,
	Subscriptions,
	LivechatVisitors,
	Messages,
	Users,
	LivechatDepartmentAgents,
	ReadReceipts,
	Rooms,
	LivechatCustomField,
	LivechatContacts,
} from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { Filter, ClientSession } from 'mongodb';
import UAParser from 'ua-parser-js';

import { callbacks } from '../../../../lib/callbacks';
import { trim } from '../../../../lib/utils/stringUtils';
import { client, shouldRetryTransaction } from '../../../../server/database/utils';
import { i18n } from '../../../../server/lib/i18n';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { FileUpload } from '../../../file-upload/server';
import { deleteMessage } from '../../../lib/server/functions/deleteMessage';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import {
	notifyOnLivechatInquiryChanged,
	notifyOnLivechatInquiryChangedByRoom,
	notifyOnRoomChangedById,
	notifyOnLivechatInquiryChangedByToken,
	notifyOnUserChange,
	notifyOnSubscriptionChangedByRoomId,
	notifyOnSubscriptionChanged,
} from '../../../lib/server/lib/notifyListener';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';
import { businessHourManager } from '../business-hour';
import { parseAgentCustomFields, updateDepartmentAgents, normalizeTransferredByData } from './Helper';
import { QueueManager } from './QueueManager';
import { RoutingManager } from './RoutingManager';
import { Visitors, type RegisterGuestType } from './Visitors';
import { registerGuestData } from './contacts/registerGuestData';
import { getRequiredDepartment } from './departmentsLib';
import type { CloseRoomParams, CloseRoomParamsByUser, CloseRoomParamsByVisitor, ILivechatMessage } from './localTypes';
import { parseTranscriptRequest } from './parseTranscriptRequest';

type AKeyOf<T> = {
	[K in keyof T]?: T[K];
};

type ICRMData = {
	_id: string;
	label?: string;
	topic?: string;
	createdAt: Date;
	lastMessageAt?: Date;
	tags?: string[];
	customFields?: IOmnichannelRoom['livechatData'];
	visitor: Pick<ILivechatVisitor, '_id' | 'token' | 'name' | 'username' | 'department' | 'phone' | 'ip'> & {
		email?: ILivechatVisitor['visitorEmails'];
		os?: string;
		browser?: string;
		customFields: ILivechatVisitor['livechatData'];
	};
	agent?: Pick<IOmnichannelAgent, '_id' | 'username' | 'name' | 'customFields'> & {
		email?: NonNullable<IOmnichannelAgent['emails']>[number]['address'];
	};
	crmData?: IOmnichannelRoom['crmData'];
};

type ChatCloser = { _id: string; username: string | undefined };

const isRoomClosedByUserParams = (params: CloseRoomParams): params is CloseRoomParamsByUser =>
	(params as CloseRoomParamsByUser).user !== undefined;
const isRoomClosedByVisitorParams = (params: CloseRoomParams): params is CloseRoomParamsByVisitor =>
	(params as CloseRoomParamsByVisitor).visitor !== undefined;

class LivechatClass {
	logger: Logger;

	webhookLogger: MainLogger;

	constructor() {
		this.logger = new Logger('Livechat');
		this.webhookLogger = this.logger.section('Webhook');
	}

	async online(department?: string, skipNoAgentSetting = false, skipFallbackCheck = false): Promise<boolean> {
		Livechat.logger.debug(`Checking online agents ${department ? `for department ${department}` : ''}`);
		if (!skipNoAgentSetting && settings.get('Livechat_accept_chats_with_no_agents')) {
			Livechat.logger.debug('Can accept without online agents: true');
			return true;
		}

		if (settings.get('Livechat_assign_new_conversation_to_bot')) {
			Livechat.logger.debug(`Fetching online bot agents for department ${department}`);
			const botAgents = await Livechat.getBotAgents(department);
			if (botAgents) {
				const onlineBots = await Livechat.countBotAgents(department);
				this.logger.debug(`Found ${onlineBots} online`);
				if (onlineBots > 0) {
					return true;
				}
			}
		}

		const agentsOnline = await this.checkOnlineAgents(department, undefined, skipFallbackCheck);
		Livechat.logger.debug(`Are online agents ${department ? `for department ${department}` : ''}?: ${agentsOnline}`);
		return agentsOnline;
	}

	async closeRoom(params: CloseRoomParams, attempts = 2): Promise<void> {
		let newRoom: IOmnichannelRoom;
		let chatCloser: ChatCloser;
		let removedInquiryObj: ILivechatInquiryRecord | null;

		const session = client.startSession();
		try {
			session.startTransaction();
			const { room, closedBy, removedInquiry } = await this.doCloseRoom(params, session);
			await session.commitTransaction();

			newRoom = room;
			chatCloser = closedBy;
			removedInquiryObj = removedInquiry;
		} catch (e) {
			this.logger.error({ err: e, msg: 'Failed to close room', afterAttempts: attempts });
			await session.abortTransaction();
			// Dont propagate transaction errors
			if (shouldRetryTransaction(e)) {
				if (attempts > 0) {
					this.logger.debug(`Retrying close room because of transient error. Attempts left: ${attempts}`);
					return this.closeRoom(params, attempts - 1);
				}

				throw new Error('error-room-cannot-be-closed-try-again');
			}
			throw e;
		} finally {
			await session.endSession();
		}

		// Note: when reaching this point, the room has been closed
		// Transaction is commited and so these messages can be sent here.
		return this.afterRoomClosed(newRoom, chatCloser, removedInquiryObj, params);
	}

	async afterRoomClosed(
		newRoom: IOmnichannelRoom,
		chatCloser: ChatCloser,
		inquiry: ILivechatInquiryRecord | null,
		params: CloseRoomParams,
	): Promise<void> {
		if (!chatCloser) {
			// this should never happen
			return;
		}
		// Note: we are okay with these messages being sent outside of the transaction. The process of sending a message
		// is huge and involves multiple db calls. Making it transactionable this way would be really hard.
		// And passing just _some_ actions to the transaction creates some deadlocks since messages are updated in the afterSaveMessages callbacks.
		const transcriptRequested =
			!!params.room.transcriptRequest || (!settings.get('Livechat_enable_transcript') && settings.get('Livechat_transcript_send_always'));
		this.logger.debug(`Sending closing message to room ${newRoom._id}`);
		await Message.saveSystemMessageAndNotifyUser('livechat-close', newRoom._id, params.comment ?? '', chatCloser, {
			groupable: false,
			transcriptRequested,
			...(isRoomClosedByVisitorParams(params) && { token: params.visitor.token }),
		});

		if (settings.get('Livechat_enable_transcript') && !settings.get('Livechat_transcript_send_always')) {
			await Message.saveSystemMessage('command', newRoom._id, 'promptTranscript', chatCloser);
		}

		this.logger.debug(`Running callbacks for room ${newRoom._id}`);

		process.nextTick(() => {
			/**
			 * @deprecated the `AppEvents.ILivechatRoomClosedHandler` event will be removed
			 * in the next major version of the Apps-Engine
			 */
			void Apps.self?.getBridges()?.getListenerBridge().livechatEvent(AppEvents.ILivechatRoomClosedHandler, newRoom);
			void Apps.self?.getBridges()?.getListenerBridge().livechatEvent(AppEvents.IPostLivechatRoomClosed, newRoom);
		});

		const visitor = isRoomClosedByVisitorParams(params) ? params.visitor : undefined;
		const opts = await parseTranscriptRequest(params.room, params.options, visitor);
		if (process.env.TEST_MODE) {
			await callbacks.run('livechat.closeRoom', {
				room: newRoom,
				options: opts,
			});
		} else {
			callbacks.runAsync('livechat.closeRoom', {
				room: newRoom,
				options: opts,
			});
		}

		void notifyOnRoomChangedById(newRoom._id);
		if (inquiry) {
			void notifyOnLivechatInquiryChanged(inquiry, 'removed');
		}

		this.logger.debug(`Room ${newRoom._id} was closed`);
	}

	async doCloseRoom(
		params: CloseRoomParams,
		session: ClientSession,
	): Promise<{ room: IOmnichannelRoom; closedBy: ChatCloser; removedInquiry: ILivechatInquiryRecord | null }> {
		const { comment } = params;
		const { room } = params;

		this.logger.debug(`Attempting to close room ${room._id}`);
		if (!room || !isOmnichannelRoom(room) || !room.open) {
			this.logger.debug(`Room ${room._id} is not open`);
			throw new Error('error-room-closed');
		}

		const commentRequired = settings.get('Livechat_request_comment_when_closing_conversation');
		if (commentRequired && !comment?.trim()) {
			throw new Error('error-comment-is-required');
		}

		const { updatedOptions: options } = await this.resolveChatTags(room, params.options);
		this.logger.debug(`Resolved chat tags for room ${room._id}`);

		const now = new Date();
		const { _id: rid, servedBy } = room;
		const serviceTimeDuration = servedBy && (now.getTime() - new Date(servedBy.ts).getTime()) / 1000;

		const closeData: IOmnichannelRoomClosingInfo = {
			closedAt: now,
			chatDuration: (now.getTime() - new Date(room.ts).getTime()) / 1000,
			...(serviceTimeDuration && { serviceTimeDuration }),
			...options,
		};
		this.logger.debug(`Room ${room._id} was closed at ${closeData.closedAt} (duration ${closeData.chatDuration})`);

		if (isRoomClosedByUserParams(params)) {
			const { user } = params;
			this.logger.debug(`Closing by user ${user?._id}`);
			closeData.closer = 'user';
			closeData.closedBy = {
				_id: user?._id || '',
				username: user?.username,
			};
		} else if (isRoomClosedByVisitorParams(params)) {
			const { visitor } = params;
			this.logger.debug(`Closing by visitor ${params.visitor._id}`);
			closeData.closer = 'visitor';
			closeData.closedBy = {
				_id: visitor._id,
				username: visitor.username,
			};
		} else {
			throw new Error('Error: Please provide details of the user or visitor who closed the room');
		}

		this.logger.debug(`Updating DB for room ${room._id} with close data`);

		const inquiry = await LivechatInquiry.findOneByRoomId(rid, { session });
		const removedInquiry = await LivechatInquiry.removeByRoomId(rid, { session });
		if (removedInquiry && removedInquiry.deletedCount !== 1) {
			throw new Error('Error removing inquiry');
		}

		const updatedRoom = await LivechatRooms.closeRoomById(rid, closeData, { session });
		if (!updatedRoom || updatedRoom.modifiedCount !== 1) {
			throw new Error('Error closing room');
		}

		const subs = await Subscriptions.countByRoomId(rid, { session });
		const removedSubs = await Subscriptions.removeByRoomId(rid, {
			async onTrash(doc) {
				void notifyOnSubscriptionChanged(doc, 'removed');
			},
			session,
		});

		if (removedSubs.deletedCount !== subs) {
			throw new Error('Error removing subscriptions');
		}

		this.logger.debug(`DB updated for room ${room._id}`);

		// Retrieve the closed room
		const newRoom = await LivechatRooms.findOneById(rid, { session });
		if (!newRoom) {
			throw new Error('Error: Room not found');
		}

		return { room: newRoom, closedBy: closeData.closedBy, removedInquiry: inquiry };
	}

	private makeVisitorAssociation(visitorId: string, roomInfo: IOmnichannelSource): ILivechatContactVisitorAssociation {
		return {
			visitorId,
			source: {
				type: roomInfo.type,
				id: roomInfo.id,
			},
		};
	}

	async createRoom({
		visitor,
		message,
		rid,
		roomInfo,
		agent,
		extraData,
	}: {
		visitor: ILivechatVisitor;
		message?: string;
		rid?: string;
		roomInfo: IOmnichannelRoomInfo;
		agent?: SelectedAgent;
		extraData?: IOmnichannelRoomExtraData;
	}) {
		if (!settings.get('Livechat_enabled')) {
			throw new Meteor.Error('error-omnichannel-is-disabled');
		}

		if (await LivechatContacts.isChannelBlocked(this.makeVisitorAssociation(visitor._id, roomInfo.source))) {
			throw new Error('error-contact-channel-blocked');
		}

		const defaultAgent =
			agent ??
			(await callbacks.run('livechat.checkDefaultAgentOnNewRoom', agent, {
				visitorId: visitor._id,
				source: roomInfo.source,
			}));
		// if no department selected verify if there is at least one active and pick the first
		if (!defaultAgent && !visitor.department) {
			const department = await getRequiredDepartment();
			Livechat.logger.debug(`No department or default agent selected for ${visitor._id}`);

			if (department) {
				Livechat.logger.debug(`Assigning ${visitor._id} to department ${department._id}`);
				visitor.department = department._id;
			}
		}

		// delegate room creation to QueueManager
		Livechat.logger.debug(`Calling QueueManager to request a room for visitor ${visitor._id}`);

		const room = await QueueManager.requestRoom({
			guest: visitor,
			message,
			rid,
			roomInfo,
			agent: defaultAgent,
			extraData,
		});

		Livechat.logger.debug(`Room obtained for visitor ${visitor._id} -> ${room._id}`);

		await Messages.setRoomIdByToken(visitor.token, room._id);

		return room;
	}

	async getRoom(
		guest: ILivechatVisitor,
		message: Pick<IMessage, 'rid' | 'msg' | 'token'>,
		roomInfo: IOmnichannelRoomInfo,
		agent?: SelectedAgent,
		extraData?: IOmnichannelRoomExtraData,
	) {
		if (!settings.get('Livechat_enabled')) {
			throw new Meteor.Error('error-omnichannel-is-disabled');
		}
		Livechat.logger.debug(`Attempting to find or create a room for visitor ${guest._id}`);
		const room = await LivechatRooms.findOneById(message.rid);

		if (room?.v._id && (await LivechatContacts.isChannelBlocked(this.makeVisitorAssociation(room.v._id, room.source)))) {
			throw new Error('error-contact-channel-blocked');
		}

		if (room && !room.open) {
			Livechat.logger.debug(`Last room for visitor ${guest._id} closed. Creating new one`);
		}

		if (!room?.open) {
			return {
				room: await this.createRoom({ visitor: guest, message: message.msg, roomInfo, agent, extraData }),
				newRoom: true,
			};
		}

		if (room.v.token !== guest.token) {
			Livechat.logger.debug(`Visitor ${guest._id} trying to access another visitor's room`);
			throw new Meteor.Error('cannot-access-room');
		}

		return { room, newRoom: false };
	}

	async checkOnlineAgents(department?: string, agent?: { agentId: string }, skipFallbackCheck = false): Promise<boolean> {
		if (agent?.agentId) {
			return Users.checkOnlineAgents(agent.agentId);
		}

		if (department) {
			const onlineForDep = await LivechatDepartmentAgents.checkOnlineForDepartment(department);
			if (onlineForDep || skipFallbackCheck) {
				return onlineForDep;
			}

			const dep = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'fallbackForwardDepartment'>>(department, {
				projection: { fallbackForwardDepartment: 1 },
			});
			if (!dep?.fallbackForwardDepartment) {
				return onlineForDep;
			}

			return this.checkOnlineAgents(dep?.fallbackForwardDepartment);
		}

		return Users.checkOnlineAgents();
	}

	async removeRoom(rid: string) {
		Livechat.logger.debug(`Deleting room ${rid}`);
		check(rid, String);
		const room = await LivechatRooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		const inquiry = await LivechatInquiry.findOneByRoomId(rid);

		const result = await Promise.allSettled([
			Messages.removeByRoomId(rid),
			ReadReceipts.removeByRoomId(rid),
			Subscriptions.removeByRoomId(rid, {
				async onTrash(doc) {
					void notifyOnSubscriptionChanged(doc, 'removed');
				},
			}),
			LivechatInquiry.removeByRoomId(rid),
			LivechatRooms.removeById(rid),
		]);

		if (result[3]?.status === 'fulfilled' && result[3].value?.deletedCount && inquiry) {
			void notifyOnLivechatInquiryChanged(inquiry, 'removed');
		}

		for (const r of result) {
			if (r.status === 'rejected') {
				this.logger.error(`Error removing room ${rid}: ${r.reason}`);
				throw new Meteor.Error('error-removing-room', 'Error removing room');
			}
		}
	}

	async registerGuest(newData: RegisterGuestType): Promise<ILivechatVisitor | null> {
		const result = await Visitors.registerGuest(newData);

		if (result) {
			await registerGuestData(newData, result);
		}

		return result;
	}

	private async getBotAgents(department?: string) {
		if (department) {
			return LivechatDepartmentAgents.getBotsForDepartment(department);
		}

		return Users.findBotAgents();
	}

	private async countBotAgents(department?: string) {
		if (department) {
			return LivechatDepartmentAgents.countBotsForDepartment(department);
		}

		return Users.countBotAgents();
	}

	private async resolveChatTags(
		room: IOmnichannelRoom,
		options: CloseRoomParams['options'] = {},
	): Promise<{ updatedOptions: CloseRoomParams['options'] }> {
		this.logger.debug(`Resolving chat tags for room ${room._id}`);

		const concatUnique = (...arrays: (string[] | undefined)[]): string[] => [
			...new Set(([] as string[]).concat(...arrays.filter((a): a is string[] => !!a))),
		];

		const { departmentId, tags: optionsTags } = room;
		const { clientAction, tags: oldRoomTags } = options;
		const roomTags = concatUnique(oldRoomTags, optionsTags);

		if (!departmentId) {
			return {
				updatedOptions: {
					...options,
					...(roomTags.length && { tags: roomTags }),
				},
			};
		}

		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'requestTagBeforeClosingChat' | 'chatClosingTags'>>(
			departmentId,
			{
				projection: { requestTagBeforeClosingChat: 1, chatClosingTags: 1 },
			},
		);
		if (!department) {
			return {
				updatedOptions: {
					...options,
					...(roomTags.length && { tags: roomTags }),
				},
			};
		}

		const { requestTagBeforeClosingChat, chatClosingTags } = department;
		const extraRoomTags = concatUnique(roomTags, chatClosingTags);

		if (!requestTagBeforeClosingChat) {
			return {
				updatedOptions: {
					...options,
					...(extraRoomTags.length && { tags: extraRoomTags }),
				},
			};
		}

		const checkRoomTags = !clientAction || (roomTags && roomTags.length > 0);
		const checkDepartmentTags = chatClosingTags && chatClosingTags.length > 0;
		if (!checkRoomTags || !checkDepartmentTags) {
			throw new Error('error-tags-must-be-assigned-before-closing-chat');
		}

		return {
			updatedOptions: {
				...options,
				...(extraRoomTags.length && { tags: extraRoomTags }),
			},
		};
	}

	async sendRequest(
		postData: {
			type: string;
			[key: string]: any;
		},
		attempts = 10,
	) {
		if (!attempts) {
			Livechat.logger.error({ msg: 'Omnichannel webhook call failed. Max attempts reached' });
			return;
		}
		const timeout = settings.get<number>('Livechat_http_timeout');
		const secretToken = settings.get<string>('Livechat_secret_token');
		const webhookUrl = settings.get<string>('Livechat_webhookUrl');
		try {
			Livechat.webhookLogger.debug({ msg: 'Sending webhook request', postData });
			const result = await fetch(webhookUrl, {
				method: 'POST',
				headers: {
					...(secretToken && { 'X-RocketChat-Livechat-Token': secretToken }),
				},
				body: postData,
				timeout,
			});

			if (result.status === 200) {
				metrics.totalLivechatWebhooksSuccess.inc();
				return result;
			}

			metrics.totalLivechatWebhooksFailures.inc();
			throw new Error(await result.text());
		} catch (err) {
			const retryAfter = timeout * 4;
			Livechat.webhookLogger.error({ msg: `Error response on ${11 - attempts} try ->`, err });
			// try 10 times after 20 seconds each
			attempts - 1 &&
				Livechat.webhookLogger.warn({ msg: `Webhook call failed. Retrying`, newAttemptAfterSeconds: retryAfter / 1000, webhookUrl });
			setTimeout(async () => {
				await Livechat.sendRequest(postData, attempts - 1);
			}, retryAfter);
		}
	}

	async saveAgentInfo(_id: string, agentData: any, agentDepartments: string[]) {
		check(_id, String);
		check(agentData, Object);
		check(agentDepartments, [String]);

		const user = await Users.findOneById(_id);
		if (!user || !(await hasRoleAsync(_id, 'livechat-agent'))) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent');
		}

		await Users.setLivechatData(_id, agentData);

		const currentDepartmentsForAgent = await LivechatDepartmentAgents.findByAgentId(_id).toArray();

		const toRemoveIds = currentDepartmentsForAgent
			.filter((dept) => !agentDepartments.includes(dept.departmentId))
			.map((dept) => dept.departmentId);
		const toAddIds = agentDepartments.filter((d) => !currentDepartmentsForAgent.some((c) => c.departmentId === d));

		await Promise.all(
			await LivechatDepartment.findInIds([...toRemoveIds, ...toAddIds], {
				projection: {
					_id: 1,
					enabled: 1,
				},
			})
				.map((dep) => {
					return updateDepartmentAgents(
						dep._id,
						{
							...(toRemoveIds.includes(dep._id) ? { remove: [{ agentId: _id }] } : { upsert: [{ agentId: _id, count: 0, order: 0 }] }),
						},
						dep.enabled,
					);
				})
				.toArray(),
		);

		return true;
	}

	async updateCallStatus(callId: string, rid: string, status: 'ended' | 'declined', user: IUser | ILivechatVisitor) {
		await Rooms.setCallStatus(rid, status);
		if (status === 'ended' || status === 'declined') {
			if (await VideoConf.declineLivechatCall(callId)) {
				return;
			}

			return updateMessage({ _id: callId, msg: status, actionLinks: [], webRtcCallEndTs: new Date(), rid }, user as unknown as IUser);
		}
	}

	notifyRoomVisitorChange(roomId: string, visitor: ILivechatVisitor) {
		void api.broadcast('omnichannel.room', roomId, {
			type: 'visitorData',
			visitor,
		});
	}

	async changeRoomVisitor(userId: string, room: IOmnichannelRoom, visitor: ILivechatVisitor) {
		const user = await Users.findOneById(userId, { projection: { _id: 1 } });
		if (!user) {
			throw new Error('error-user-not-found');
		}

		if (!(await canAccessRoomAsync(room, user))) {
			throw new Error('error-not-allowed');
		}

		await LivechatRooms.changeVisitorByRoomId(room._id, visitor);

		this.notifyRoomVisitorChange(room._id, visitor);

		return LivechatRooms.findOneById(room._id);
	}

	async notifyAgentStatusChanged(userId: string, status?: UserStatus) {
		if (!status) {
			return;
		}

		void callbacks.runAsync('livechat.agentStatusChanged', { userId, status });
		if (!settings.get('Livechat_show_agent_info')) {
			return;
		}

		await LivechatRooms.findOpenByAgent(userId).forEach((room) => {
			void api.broadcast('omnichannel.room', room._id, {
				type: 'agentStatus',
				status,
			});
		});
	}

	async updateMessage({ guest, message }: { guest: ILivechatVisitor; message: AtLeast<IMessage, '_id' | 'msg' | 'rid'> }) {
		check(message, Match.ObjectIncluding({ _id: String }));

		const originalMessage = await Messages.findOneById<Pick<IMessage, 'u' | '_id'>>(message._id, { projection: { u: 1 } });
		if (!originalMessage?._id) {
			return;
		}

		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = originalMessage.u && originalMessage.u._id === guest._id;

		if (!editAllowed || !editOwn) {
			throw new Error('error-action-not-allowed');
		}

		// TODO: Apps sends an `any` object and apparently we just check for _id being present
		// while updateMessage expects AtLeast<id, msg, rid>
		await updateMessage(message, guest as unknown as IUser);

		return true;
	}

	async closeOpenChats(userId: string, comment?: string) {
		this.logger.debug(`Closing open chats for user ${userId}`);
		const user = await Users.findOneById(userId);

		const extraQuery = await callbacks.run('livechat.applyDepartmentRestrictions', {}, { userId });
		const openChats = LivechatRooms.findOpenByAgent(userId, extraQuery);
		const promises: Promise<void>[] = [];
		await openChats.forEach((room) => {
			promises.push(this.closeRoom({ user, room, comment }));
		});

		await Promise.all(promises);
	}

	async transfer(room: IOmnichannelRoom, guest: ILivechatVisitor, transferData: TransferData) {
		this.logger.debug(`Transfering room ${room._id} [Transfered by: ${transferData?.transferredBy?._id}]`);
		if (room.onHold) {
			throw new Error('error-room-onHold');
		}

		if (transferData.departmentId) {
			const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'name' | '_id'>>(transferData.departmentId, {
				projection: { name: 1 },
			});
			if (!department) {
				throw new Error('error-invalid-department');
			}

			transferData.department = department;
			this.logger.debug(`Transfering room ${room._id} to department ${transferData.department?._id}`);
		}

		return RoutingManager.transferRoom(room, guest, transferData);
	}

	async forwardOpenChats(userId: string) {
		this.logger.debug(`Transferring open chats for user ${userId}`);
		const user = await Users.findOneById(userId);
		if (!user) {
			throw new Error('error-invalid-user');
		}

		const { _id, username, name } = user;
		for await (const room of LivechatRooms.findOpenByAgent(userId)) {
			const guest = await LivechatVisitors.findOneEnabledById(room.v._id);
			if (!guest) {
				continue;
			}

			const transferredBy = normalizeTransferredByData({ _id, username, name }, room);
			await this.transfer(room, guest, {
				transferredBy,
				departmentId: guest.department,
			});
		}
	}

	showConnecting() {
		return RoutingManager.getConfig()?.showConnecting || false;
	}

	async getInitSettings() {
		const validSettings = [
			'Livechat_title',
			'Livechat_title_color',
			'Livechat_enable_message_character_limit',
			'Livechat_message_character_limit',
			'Message_MaxAllowedSize',
			'Livechat_enabled',
			'Livechat_registration_form',
			'Livechat_allow_switching_departments',
			'Livechat_offline_title',
			'Livechat_offline_title_color',
			'Livechat_offline_message',
			'Livechat_offline_success_message',
			'Livechat_offline_form_unavailable',
			'Livechat_display_offline_form',
			'Omnichannel_call_provider',
			'Language',
			'Livechat_enable_transcript',
			'Livechat_transcript_message',
			'Livechat_fileupload_enabled',
			'FileUpload_Enabled',
			'Livechat_conversation_finished_message',
			'Livechat_conversation_finished_text',
			'Livechat_name_field_registration_form',
			'Livechat_email_field_registration_form',
			'Livechat_registration_form_message',
			'Livechat_force_accept_data_processing_consent',
			'Livechat_data_processing_consent_text',
			'Livechat_show_agent_info',
			'Livechat_clear_local_storage_when_chat_ended',
			'Livechat_history_monitor_type',
			'Livechat_hide_system_messages',
			'Livechat_widget_position',
			'Livechat_background',
			'Assets_livechat_widget_logo',
			'Livechat_hide_watermark',
			'Omnichannel_allow_visitors_to_close_conversation',
		] as const;

		type SettingTypes = (typeof validSettings)[number] | 'Livechat_Show_Connecting';

		const rcSettings = validSettings.reduce<Record<SettingTypes, string | boolean>>((acc, setting) => {
			acc[setting] = settings.get(setting);
			return acc;
		}, {} as any);

		rcSettings.Livechat_Show_Connecting = this.showConnecting();

		return rcSettings;
	}

	async sendMessage({
		guest,
		message,
		roomInfo,
		agent,
	}: {
		guest: ILivechatVisitor;
		message: ILivechatMessage;
		roomInfo: IOmnichannelRoomInfo;
		agent?: SelectedAgent;
	}) {
		const { room, newRoom } = await this.getRoom(guest, message, roomInfo, agent);
		if (guest.name) {
			message.alias = guest.name;
		}
		return Object.assign(await sendMessage(guest, { ...message, token: guest.token }, room), {
			newRoom,
			showConnecting: this.showConnecting(),
		});
	}

	async removeGuest(_id: string) {
		const guest = await LivechatVisitors.findOneEnabledById(_id, { projection: { _id: 1, token: 1 } });
		if (!guest) {
			throw new Error('error-invalid-guest');
		}

		await this.cleanGuestHistory(guest);
		return LivechatVisitors.disableById(_id);
	}

	async cleanGuestHistory(guest: ILivechatVisitor) {
		const { token } = guest;

		// This shouldn't be possible, but just in case
		if (!token) {
			throw new Error('error-invalid-guest');
		}

		const cursor = LivechatRooms.findByVisitorToken(token);
		for await (const room of cursor) {
			await Promise.all([
				Subscriptions.removeByRoomId(room._id, {
					async onTrash(doc) {
						void notifyOnSubscriptionChanged(doc, 'removed');
					},
				}),
				FileUpload.removeFilesByRoomId(room._id),
				Messages.removeByRoomId(room._id),
				ReadReceipts.removeByRoomId(room._id),
			]);
		}

		await LivechatRooms.removeByVisitorToken(token);

		const livechatInquiries = await LivechatInquiry.findIdsByVisitorToken(token).toArray();
		await LivechatInquiry.removeByIds(livechatInquiries.map(({ _id }) => _id));
		void notifyOnLivechatInquiryChanged(livechatInquiries, 'removed');
	}

	async deleteMessage({ guest, message }: { guest: ILivechatVisitor; message: IMessage }) {
		const deleteAllowed = settings.get<boolean>('Message_AllowDeleting');
		const editOwn = message.u && message.u._id === guest._id;

		if (!deleteAllowed || !editOwn) {
			throw new Error('error-action-not-allowed');
		}

		await deleteMessage(message, guest as unknown as IUser);

		return true;
	}

	async setUserStatusLivechatIf(userId: string, status: ILivechatAgentStatus, condition?: Filter<IUser>, fields?: AKeyOf<ILivechatAgent>) {
		const result = await Users.setLivechatStatusIf(userId, status, condition, fields);

		if (result.modifiedCount > 0) {
			void notifyOnUserChange({
				id: userId,
				clientAction: 'updated',
				diff: { ...fields, statusLivechat: status },
			});
		}

		callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });
		return result;
	}

	async returnRoomAsInquiry(room: IOmnichannelRoom, departmentId?: string, overrideTransferData: any = {}) {
		this.logger.debug({ msg: `Transfering room to ${departmentId ? 'department' : ''} queue`, room });
		if (!room.open) {
			throw new Meteor.Error('room-closed');
		}

		if (room.onHold) {
			throw new Meteor.Error('error-room-onHold');
		}

		if (!room.servedBy) {
			return false;
		}

		const user = await Users.findOneById(room.servedBy._id);
		if (!user?._id) {
			throw new Meteor.Error('error-invalid-user');
		}

		// find inquiry corresponding to room
		const inquiry = await LivechatInquiry.findOne({ rid: room._id });
		if (!inquiry) {
			return false;
		}

		const transferredBy = normalizeTransferredByData(user, room);
		this.logger.debug(`Transfering room ${room._id} by user ${transferredBy._id}`);
		const transferData = { roomId: room._id, scope: 'queue', departmentId, transferredBy, ...overrideTransferData };
		try {
			await this.saveTransferHistory(room, transferData);
			await RoutingManager.unassignAgent(inquiry, departmentId);
		} catch (e) {
			this.logger.error(e);
			throw new Meteor.Error('error-returning-inquiry');
		}

		callbacks.runAsync('livechat:afterReturnRoomAsInquiry', { room });

		return true;
	}

	async saveTransferHistory(room: IOmnichannelRoom, transferData: TransferData) {
		const { departmentId: previousDepartment } = room;
		const { department: nextDepartment, transferredBy, transferredTo, scope, comment } = transferData;

		check(
			transferredBy,
			Match.ObjectIncluding({
				_id: String,
				username: String,
				name: Match.Maybe(String),
				userType: String,
			}),
		);

		const { _id, username } = transferredBy;
		const scopeData = scope || (nextDepartment ? 'department' : 'agent');
		this.logger.info(`Storing new chat transfer of ${room._id} [Transfered by: ${_id} to ${scopeData}]`);

		const transferMessage = {
			...(transferData.transferredBy.userType === 'visitor' && { token: room.v.token }),
			transferData: {
				transferredBy,
				ts: new Date(),
				scope: scopeData,
				comment,
				...(previousDepartment && { previousDepartment }),
				...(nextDepartment && { nextDepartment }),
				...(transferredTo && { transferredTo }),
			},
		};

		await Message.saveSystemMessageAndNotifyUser('livechat_transfer_history', room._id, '', { _id, username }, transferMessage);
	}

	async saveGuest(guestData: Pick<ILivechatVisitor, '_id' | 'name' | 'livechatData'> & { email?: string; phone?: string }, userId: string) {
		const { _id, name, email, phone, livechatData = {} } = guestData;

		const visitor = await LivechatVisitors.findOneById(_id, { projection: { _id: 1 } });
		if (!visitor) {
			throw new Error('error-invalid-visitor');
		}

		this.logger.debug({ msg: 'Saving guest', guestData });
		const updateData: {
			name?: string | undefined;
			username?: string | undefined;
			email?: string | undefined;
			phone?: string | undefined;
			livechatData: {
				[k: string]: any;
			};
		} = { livechatData: {} };

		if (name) {
			updateData.name = name;
		}
		if (email) {
			updateData.email = email;
		}
		if (phone) {
			updateData.phone = phone;
		}

		const customFields: Record<string, any> = {};

		if ((!userId || (await hasPermissionAsync(userId, 'edit-livechat-room-customfields'))) && Object.keys(livechatData).length) {
			this.logger.debug({ msg: `Saving custom fields for visitor ${_id}`, livechatData });
			for await (const field of LivechatCustomField.findByScope('visitor')) {
				if (!livechatData.hasOwnProperty(field._id)) {
					continue;
				}
				const value = trim(livechatData[field._id]);
				if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
					const regexp = new RegExp(field.regexp);
					if (!regexp.test(value)) {
						throw new Error(i18n.t('error-invalid-custom-field-value'));
					}
				}
				customFields[field._id] = value;
			}
			updateData.livechatData = customFields;
			Livechat.logger.debug(`About to update ${Object.keys(customFields).length} custom fields for visitor ${_id}`);
		}
		const ret = await LivechatVisitors.saveGuestById(_id, updateData);

		setImmediate(() => {
			void Apps.self?.triggerEvent(AppEvents.IPostLivechatGuestSaved, _id);
		});

		return ret;
	}

	async setCustomFields({ token, key, value, overwrite }: { key: string; value: string; overwrite: boolean; token: string }) {
		Livechat.logger.debug(`Setting custom fields data for visitor with token ${token}`);

		const customField = await LivechatCustomField.findOneById(key);
		if (!customField) {
			throw new Error('invalid-custom-field');
		}

		if (customField.regexp !== undefined && customField.regexp !== '') {
			const regexp = new RegExp(customField.regexp);
			if (!regexp.test(value)) {
				throw new Error(i18n.t('error-invalid-custom-field-value', { field: key }));
			}
		}

		let result;
		if (customField.scope === 'room') {
			result = await LivechatRooms.updateDataByToken(token, key, value, overwrite);
		} else {
			result = await LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
		}

		if (typeof result === 'boolean') {
			// Note: this only happens when !overwrite is passed, in this case we don't do any db update
			return 0;
		}

		return result.modifiedCount;
	}

	async requestTranscript({
		rid,
		email,
		subject,
		user,
	}: {
		rid: string;
		email: string;
		subject: string;
		user: AtLeast<IUser, '_id' | 'username' | 'utcOffset' | 'name'>;
	}) {
		const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1, open: 1, transcriptRequest: 1 } });

		if (!room?.open) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		if (room.transcriptRequest) {
			throw new Meteor.Error('error-transcript-already-requested', 'Transcript already requested');
		}

		if (!(await Omnichannel.isWithinMACLimit(room))) {
			throw new Error('error-mac-limit-reached');
		}

		const { _id, username, name, utcOffset } = user;
		const transcriptRequest = {
			requestedAt: new Date(),
			requestedBy: {
				_id,
				username,
				name,
				utcOffset,
			},
			email,
			subject,
		};

		await LivechatRooms.setEmailTranscriptRequestedByRoomId(rid, transcriptRequest);
		return true;
	}

	async afterRemoveAgent(user: AtLeast<IUser, '_id' | 'username'>) {
		await callbacks.run('livechat.afterAgentRemoved', { agent: user });
		return true;
	}

	async removeAgent(username: string) {
		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Error('error-invalid-user');
		}

		const { _id } = user;

		if (await removeUserFromRolesAsync(_id, ['livechat-agent'])) {
			return this.afterRemoveAgent(user);
		}

		return false;
	}

	async removeManager(username: string) {
		const user = await Users.findOneByUsername(username, { projection: { _id: 1 } });

		if (!user) {
			throw new Error('error-invalid-user');
		}

		return removeUserFromRolesAsync(user._id, ['livechat-manager']);
	}

	async getLivechatRoomGuestInfo(room: IOmnichannelRoom) {
		const visitor = await LivechatVisitors.findOneEnabledById(room.v._id);
		if (!visitor) {
			throw new Error('error-invalid-visitor');
		}

		const agent = room.servedBy?._id ? await Users.findOneById(room.servedBy?._id) : null;

		const ua = new UAParser();
		ua.setUA(visitor.userAgent || '');

		const postData: ICRMData = {
			_id: room._id,
			label: room.fname || room.label, // using same field for compatibility
			topic: room.topic,
			createdAt: room.ts,
			lastMessageAt: room.lm,
			tags: room.tags,
			customFields: room.livechatData,
			visitor: {
				_id: visitor._id,
				token: visitor.token,
				name: visitor.name,
				username: visitor.username,
				department: visitor.department,
				ip: visitor.ip,
				os: ua.getOS().name && `${ua.getOS().name} ${ua.getOS().version}`,
				browser: ua.getBrowser().name && `${ua.getBrowser().name} ${ua.getBrowser().version}`,
				customFields: visitor.livechatData,
			},
		};

		if (agent) {
			const customFields = parseAgentCustomFields(agent.customFields);

			postData.agent = {
				_id: agent._id,
				username: agent.username,
				name: agent.name,
				...(customFields && { customFields }),
			};

			if (agent.emails && agent.emails.length > 0) {
				postData.agent.email = agent.emails[0].address;
			}
		}

		if (room.crmData) {
			postData.crmData = room.crmData;
		}

		if (visitor.visitorEmails && visitor.visitorEmails.length > 0) {
			postData.visitor.email = visitor.visitorEmails;
		}
		if (visitor.phone && visitor.phone.length > 0) {
			postData.visitor.phone = visitor.phone;
		}

		return postData;
	}

	async allowAgentChangeServiceStatus(statusLivechat: ILivechatAgentStatus, agentId: string) {
		if (statusLivechat !== ILivechatAgentStatus.AVAILABLE) {
			return true;
		}

		return businessHourManager.allowAgentChangeServiceStatus(agentId);
	}

	async notifyGuestStatusChanged(token: string, status: UserStatus) {
		await LivechatRooms.updateVisitorStatus(token, status);

		const inquiryVisitorStatus = await LivechatInquiry.updateVisitorStatus(token, status);

		if (inquiryVisitorStatus.modifiedCount) {
			void notifyOnLivechatInquiryChangedByToken(token, 'updated', { v: { status } });
		}
	}

	async setUserStatusLivechat(userId: string, status: ILivechatAgentStatus) {
		const user = await Users.setLivechatStatus(userId, status);
		callbacks.runAsync('livechat.setUserStatusLivechat', { userId, status });

		if (user.modifiedCount > 0) {
			void notifyOnUserChange({
				id: userId,
				clientAction: 'updated',
				diff: {
					statusLivechat: status,
					livechatStatusSystemModified: false,
				},
			});
		}

		return user;
	}

	async afterAgentAdded(user: IUser) {
		await Promise.all([
			Users.setOperator(user._id, true),
			this.setUserStatusLivechat(user._id, user.status !== 'offline' ? ILivechatAgentStatus.AVAILABLE : ILivechatAgentStatus.NOT_AVAILABLE),
		]);
		callbacks.runAsync('livechat.onNewAgentCreated', user._id);

		return user;
	}

	async addAgent(username: string) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user');
		}

		if (await addUserRolesAsync(user._id, ['livechat-agent'])) {
			return this.afterAgentAdded(user);
		}

		return false;
	}

	async afterAgentUserActivated(user: IUser) {
		if (!user.roles.includes('livechat-agent')) {
			throw new Error('invalid-user-role');
		}
		await Users.setOperator(user._id, true);
		callbacks.runAsync('livechat.onNewAgentCreated', user._id);
	}

	async addManager(username: string) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user');
		}

		if (await addUserRolesAsync(user._id, ['livechat-manager'])) {
			return user;
		}

		return false;
	}

	async saveRoomInfo(
		roomData: {
			_id: string;
			topic?: string;
			tags?: string[];
			livechatData?: { [k: string]: string };
			// For priority and SLA, if the value is blank (ie ""), then system will remove the priority or SLA from the room
			priorityId?: string;
			slaId?: string;
		},
		guestData?: {
			_id: string;
			name?: string;
			email?: string;
			phone?: string;
			livechatData?: { [k: string]: string };
		},
		userId?: string,
	) {
		this.logger.debug(`Saving room information on room ${roomData._id}`);
		const { livechatData = {} } = roomData;
		const customFields: Record<string, string> = {};

		if ((!userId || (await hasPermissionAsync(userId, 'edit-livechat-room-customfields'))) && Object.keys(livechatData).length) {
			const fields = LivechatCustomField.findByScope('room');
			for await (const field of fields) {
				if (!livechatData.hasOwnProperty(field._id)) {
					continue;
				}
				const value = trim(livechatData[field._id]);
				if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
					const regexp = new RegExp(field.regexp);
					if (!regexp.test(value)) {
						throw new Meteor.Error(i18n.t('error-invalid-custom-field-value', { field: field.label }));
					}
				}
				customFields[field._id] = value;
			}
			roomData.livechatData = customFields;
			Livechat.logger.debug(`About to update ${Object.keys(customFields).length} custom fields on room ${roomData._id}`);
		}

		await LivechatRooms.saveRoomById(roomData);

		setImmediate(() => {
			void Apps.self?.triggerEvent(AppEvents.IPostLivechatRoomSaved, roomData._id);
		});

		if (guestData?.name?.trim().length) {
			const { _id: rid } = roomData;
			const { name } = guestData;

			const responses = await Promise.all([
				Rooms.setFnameById(rid, name),
				LivechatInquiry.setNameByRoomId(rid, name),
				Subscriptions.updateDisplayNameByRoomId(rid, name),
			]);

			if (responses[1]?.modifiedCount) {
				void notifyOnLivechatInquiryChangedByRoom(rid, 'updated', { name });
			}

			if (responses[2]?.modifiedCount) {
				await notifyOnSubscriptionChangedByRoomId(rid);
			}
		}

		void notifyOnRoomChangedById(roomData._id);

		return true;
	}
}

export const Livechat = new LivechatClass();

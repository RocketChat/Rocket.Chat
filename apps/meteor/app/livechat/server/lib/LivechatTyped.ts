import dns from 'dns';
import * as util from 'util';

import { Apps, AppEvents } from '@rocket.chat/apps';
import { Message, VideoConf, api, Omnichannel } from '@rocket.chat/core-services';
import type {
	IOmnichannelRoom,
	IOmnichannelRoomClosingInfo,
	IUser,
	MessageTypesValues,
	ILivechatVisitor,
	SelectedAgent,
	ILivechatAgent,
	IMessage,
	ILivechatDepartment,
	AtLeast,
	TransferData,
	MessageAttachment,
	IMessageInbox,
	IOmnichannelAgent,
	ILivechatDepartmentAgents,
	LivechatDepartmentDTO,
	OmnichannelSourceType,
	ILivechatInquiryRecord,
} from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, UserStatus, isOmnichannelRoom } from '@rocket.chat/core-typings';
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
} from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { Filter, FindCursor, ClientSession, MongoError } from 'mongodb';
import UAParser from 'ua-parser-js';

import { callbacks } from '../../../../lib/callbacks';
import { trim } from '../../../../lib/utils/stringUtils';
import { client } from '../../../../server/database/utils';
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
	notifyOnLivechatDepartmentAgentChangedByDepartmentId,
	notifyOnSubscriptionChangedByRoomId,
	notifyOnSubscriptionChanged,
} from '../../../lib/server/lib/notifyListener';
import * as Mailer from '../../../mailer/server/api';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';
import { businessHourManager } from '../business-hour';
import { createContact } from './Contacts';
import { parseAgentCustomFields, updateDepartmentAgents, validateEmail, normalizeTransferredByData } from './Helper';
import { QueueManager } from './QueueManager';
import { RoutingManager } from './RoutingManager';
import { isDepartmentCreationAvailable } from './isDepartmentCreationAvailable';
import type { CloseRoomParams, CloseRoomParamsByUser, CloseRoomParamsByVisitor } from './localTypes';
import { parseTranscriptRequest } from './parseTranscriptRequest';

type RegisterGuestType = Partial<Pick<ILivechatVisitor, 'token' | 'name' | 'department' | 'status' | 'username'>> & {
	id?: string;
	connectionData?: any;
	email?: string;
	phone?: { number: string };
};

type OfflineMessageData = {
	message: string;
	name: string;
	email: string;
	department?: string;
	host?: string;
};

type UploadedFile = {
	_id: string;
	name?: string;
	type?: string;
	size?: number;
	description?: string;
	identify?: { size: { width: number; height: number } };
	format?: string;
};

export interface ILivechatMessage {
	token: string;
	_id: string;
	rid: string;
	msg: string;
	file?: UploadedFile;
	files?: UploadedFile[];
	attachments?: MessageAttachment[];
	alias?: string;
	groupable?: boolean;
	blocks?: IMessage['blocks'];
	email?: IMessageInbox['email'];
}

type AKeyOf<T> = {
	[K in keyof T]?: T[K];
};

type PageInfo = { title: string; location: { href: string }; change: string };

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

const dnsResolveMx = util.promisify(dns.resolveMx);

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
				const onlineBots = await botAgents.count();
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

	async getOnlineAgents(department?: string, agent?: SelectedAgent | null): Promise<FindCursor<ILivechatAgent> | undefined> {
		if (agent?.agentId) {
			return Users.findOnlineAgents(agent.agentId);
		}

		if (department) {
			const departmentAgents = await LivechatDepartmentAgents.getOnlineForDepartment(department);
			if (!departmentAgents) {
				return;
			}

			const agentIds = await departmentAgents.map(({ agentId }) => agentId).toArray();
			if (!agentIds.length) {
				return;
			}

			return Users.findByIds<ILivechatAgent>([...new Set(agentIds)]);
		}
		return Users.findOnlineAgents();
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
			if (
				(e as unknown as MongoError)?.errorLabels?.includes('UnknownTransactionCommitResult') ||
				(e as unknown as MongoError)?.errorLabels?.includes('TransientTransactionError')
			) {
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

	async getRequiredDepartment(onlineRequired = true) {
		const departments = LivechatDepartment.findEnabledWithAgents();

		for await (const dept of departments) {
			if (!dept.showOnRegistration) {
				continue;
			}
			if (!onlineRequired) {
				return dept;
			}

			const onlineAgents = await LivechatDepartmentAgents.getOnlineForDepartment(dept._id);
			if (onlineAgents && (await onlineAgents.count())) {
				return dept;
			}
		}
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
		roomInfo: {
			source?: IOmnichannelRoom['source'];
			[key: string]: unknown;
		};
		agent?: SelectedAgent;
		extraData?: Record<string, unknown>;
	}) {
		if (!settings.get('Livechat_enabled')) {
			throw new Meteor.Error('error-omnichannel-is-disabled');
		}

		const defaultAgent = await callbacks.run('livechat.checkDefaultAgentOnNewRoom', agent, visitor);
		// if no department selected verify if there is at least one active and pick the first
		if (!defaultAgent && !visitor.department) {
			const department = await this.getRequiredDepartment();
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

	async getRoom<
		E extends Record<string, unknown> & {
			sla?: string;
			customFields?: Record<string, unknown>;
			source?: OmnichannelSourceType;
		},
	>(
		guest: ILivechatVisitor,
		message: Pick<IMessage, 'rid' | 'msg' | 'token'>,
		roomInfo: {
			source?: IOmnichannelRoom['source'];
			[key: string]: unknown;
		},
		agent?: SelectedAgent,
		extraData?: E,
	) {
		if (!settings.get('Livechat_enabled')) {
			throw new Meteor.Error('error-omnichannel-is-disabled');
		}
		Livechat.logger.debug(`Attempting to find or create a room for visitor ${guest._id}`);
		const room = await LivechatRooms.findOneById(message.rid);

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

	async setDepartmentForGuest({ token, department }: { token: string; department: string }) {
		check(token, String);
		check(department, String);

		Livechat.logger.debug(`Switching departments for user with token ${token} (to ${department})`);

		const updateUser = {
			$set: {
				department,
			},
		};

		const dep = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id'>>(department, { projection: { _id: 1 } });
		if (!dep) {
			throw new Meteor.Error('invalid-department', 'Provided department does not exists');
		}

		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
		if (!visitor) {
			throw new Meteor.Error('invalid-token', 'Provided token is invalid');
		}
		await LivechatVisitors.updateById(visitor._id, updateUser);
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

	isValidObject(obj: unknown): obj is Record<string, any> {
		return typeof obj === 'object' && obj !== null;
	}

	async registerGuest({
		id,
		token,
		name,
		phone,
		email,
		department,
		username,
		connectionData,
		status = UserStatus.ONLINE,
	}: RegisterGuestType): Promise<ILivechatVisitor | null> {
		check(token, String);
		check(id, Match.Maybe(String));

		Livechat.logger.debug(`New incoming conversation: id: ${id} | token: ${token}`);

		const visitorDataToUpdate: Partial<ILivechatVisitor> & { userAgent?: string; ip?: string; host?: string } = {
			token,
			status,
			...(phone?.number ? { phone: [{ phoneNumber: phone.number }] } : {}),
			...(name ? { name } : {}),
		};

		if (email) {
			const visitorEmail = email.trim().toLowerCase();
			validateEmail(visitorEmail);
			visitorDataToUpdate.visitorEmails = [{ address: visitorEmail }];
		}

		const livechatVisitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (livechatVisitor?.department !== department && department) {
			Livechat.logger.debug(`Attempt to find a department with id/name ${department}`);
			const dep = await LivechatDepartment.findOneByIdOrName(department, { projection: { _id: 1 } });
			if (!dep) {
				Livechat.logger.debug(`Invalid department provided: ${department}`);
				throw new Meteor.Error('error-invalid-department', 'The provided department is invalid');
			}
			Livechat.logger.debug(`Assigning visitor ${token} to department ${dep._id}`);
			visitorDataToUpdate.department = dep._id;
		}

		visitorDataToUpdate.token = livechatVisitor?.token || token;

		let existingUser = null;

		if (livechatVisitor) {
			Livechat.logger.debug('Found matching user by token');
			visitorDataToUpdate._id = livechatVisitor._id;
		} else if (phone?.number && (existingUser = await LivechatVisitors.findOneVisitorByPhone(phone.number))) {
			Livechat.logger.debug('Found matching user by phone number');
			visitorDataToUpdate._id = existingUser._id;
			// Don't change token when matching by phone number, use current visitor token
			visitorDataToUpdate.token = existingUser.token;
		} else if (email && (existingUser = await LivechatVisitors.findOneGuestByEmailAddress(email))) {
			Livechat.logger.debug('Found matching user by email');
			visitorDataToUpdate._id = existingUser._id;
		} else if (!livechatVisitor) {
			Livechat.logger.debug(`No matches found. Attempting to create new user with token ${token}`);

			visitorDataToUpdate._id = id || undefined;
			visitorDataToUpdate.username = username || (await LivechatVisitors.getNextVisitorUsername());
			visitorDataToUpdate.status = status;
			visitorDataToUpdate.ts = new Date();

			if (settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations') && Livechat.isValidObject(connectionData)) {
				Livechat.logger.debug(`Saving connection data for visitor ${token}`);
				const { httpHeaders, clientAddress } = connectionData;
				if (Livechat.isValidObject(httpHeaders)) {
					visitorDataToUpdate.userAgent = httpHeaders['user-agent'];
					visitorDataToUpdate.ip = httpHeaders['x-real-ip'] || httpHeaders['x-forwarded-for'] || clientAddress;
					visitorDataToUpdate.host = httpHeaders?.host;
				}
			}
		}

		if (process.env.TEST_MODE?.toUpperCase() === 'TRUE') {
			const contactId = await createContact({
				name: name ?? (visitorDataToUpdate.username as string),
				emails: email ? [email] : [],
				phones: phone ? [phone.number] : [],
				unknown: true,
			});
			visitorDataToUpdate.contactId = contactId;
		}

		const upsertedLivechatVisitor = await LivechatVisitors.updateOneByIdOrToken(visitorDataToUpdate, {
			upsert: true,
			returnDocument: 'after',
		});

		if (!upsertedLivechatVisitor.value) {
			Livechat.logger.debug(`No visitor found after upsert`);
			return null;
		}

		return upsertedLivechatVisitor.value;
	}

	private async getBotAgents(department?: string) {
		if (department) {
			return LivechatDepartmentAgents.getBotsForDepartment(department);
		}

		return Users.findBotAgents();
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

	private async sendEmail(from: string, to: string, replyTo: string, subject: string, html: string): Promise<void> {
		await Mailer.send({
			to,
			from,
			replyTo,
			subject,
			html,
		});
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

	async getRoomMessages({ rid }: { rid: string }) {
		const room = await Rooms.findOneById(rid, { projection: { t: 1 } });
		if (room?.t !== 'l') {
			throw new Meteor.Error('invalid-room');
		}

		const ignoredMessageTypes: MessageTypesValues[] = [
			'livechat_navigation_history',
			'livechat_transcript_history',
			'command',
			'livechat-close',
			'livechat-started',
			'livechat_video_call',
		];

		return Messages.findVisibleByRoomIdNotContainingTypes(rid, ignoredMessageTypes, {
			sort: { ts: 1 },
		});
	}

	async archiveDepartment(_id: string) {
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'businessHourId'>>(_id, {
			projection: { _id: 1, businessHourId: 1 },
		});

		if (!department) {
			throw new Error('department-not-found');
		}

		await Promise.all([LivechatDepartmentAgents.disableAgentsByDepartmentId(_id), LivechatDepartment.archiveDepartment(_id)]);

		void notifyOnLivechatDepartmentAgentChangedByDepartmentId(_id);

		await callbacks.run('livechat.afterDepartmentArchived', department);
	}

	async unarchiveDepartment(_id: string) {
		const department = await LivechatDepartment.findOneById(_id, { projection: { _id: 1 } });

		if (!department) {
			throw new Meteor.Error('department-not-found');
		}

		// TODO: these kind of actions should be on events instead of here
		await Promise.all([LivechatDepartmentAgents.enableAgentsByDepartmentId(_id), LivechatDepartment.unarchiveDepartment(_id)]);

		void notifyOnLivechatDepartmentAgentChangedByDepartmentId(_id);

		return true;
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

	async sendOfflineMessage(data: OfflineMessageData) {
		if (!settings.get('Livechat_display_offline_form')) {
			throw new Error('error-offline-form-disabled');
		}

		const { message, name, email, department, host } = data;

		if (!email) {
			throw new Error('error-invalid-email');
		}

		const emailMessage = `${message}`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');

		let html = '<h1>New livechat message</h1>';
		if (host && host !== '') {
			html = html.concat(`<p><strong>Sent from:</strong><a href='${host}'> ${host}</a></p>`);
		}
		html = html.concat(`
			<p><strong>Visitor name:</strong> ${name}</p>
			<p><strong>Visitor email:</strong> ${email}</p>
			<p><strong>Message:</strong><br>${emailMessage}</p>`);

		const fromEmail = settings.get<string>('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		let from: string;
		if (fromEmail) {
			from = fromEmail[0];
		} else {
			from = settings.get<string>('From_Email');
		}

		if (settings.get('Livechat_validate_offline_email')) {
			const emailDomain = email.substr(email.lastIndexOf('@') + 1);

			try {
				await dnsResolveMx(emailDomain);
			} catch (e) {
				throw new Meteor.Error('error-invalid-email-address');
			}
		}

		// TODO Block offline form if Livechat_offline_email is undefined
		// (it does not make sense to have an offline form that does nothing)
		// `this.sendEmail` will throw an error if the email is invalid
		// thus this breaks livechat, since the "to" email is invalid, and that returns an [invalid email] error to the livechat client
		let emailTo = settings.get<string>('Livechat_offline_email');
		if (department && department !== '') {
			const dep = await LivechatDepartment.findOneByIdOrName(department, { projection: { email: 1 } });
			if (dep) {
				emailTo = dep.email || emailTo;
			}
		}

		const fromText = `${name} - ${email} <${from}>`;
		const replyTo = `${name} <${email}>`;
		const subject = `Livechat offline message from ${name}: ${`${emailMessage}`.substring(0, 20)}`;
		await this.sendEmail(fromText, emailTo, replyTo, subject, html);

		setImmediate(() => {
			void callbacks.run('livechat.offlineMessage', data);
		});
	}

	async sendMessage({
		guest,
		message,
		roomInfo,
		agent,
	}: {
		guest: ILivechatVisitor;
		message: ILivechatMessage;
		roomInfo: {
			source?: IOmnichannelRoom['source'];
			[key: string]: unknown;
		};
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

	async savePageHistory(token: string, roomId: string | undefined, pageInfo: PageInfo) {
		this.logger.debug({
			msg: `Saving page movement history for visitor with token ${token}`,
			pageInfo,
			roomId,
		});

		if (pageInfo.change !== settings.get<string>('Livechat_history_monitor_type')) {
			return;
		}
		const user = await Users.findOneById('rocket.cat');

		if (!user) {
			throw new Error('error-invalid-user');
		}

		const pageTitle = pageInfo.title;
		const pageUrl = pageInfo.location.href;
		const extraData: {
			navigation: {
				page: PageInfo;
				token: string;
			};
			expireAt?: number;
			_hidden?: boolean;
		} = {
			navigation: {
				page: pageInfo,
				token,
			},
		};

		if (!roomId) {
			this.logger.warn(`Saving page history without room id for visitor with token ${token}`);
			// keep history of unregistered visitors for 1 month
			const keepHistoryMiliseconds = 2592000000;
			extraData.expireAt = new Date().getTime() + keepHistoryMiliseconds;
		}

		if (!settings.get('Livechat_Visitor_navigation_as_a_message')) {
			extraData._hidden = true;
		}

		// @ts-expect-error: Investigating on which case we won't receive a roomId and where that history is supposed to be stored
		return Message.saveSystemMessage('livechat_navigation_history', roomId, `${pageTitle} - ${pageUrl}`, user, extraData);
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

	async saveDepartmentAgents(
		_id: string,
		departmentAgents: {
			upsert?: Pick<ILivechatDepartmentAgents, 'agentId' | 'count' | 'order' | 'username'>[];
			remove?: Pick<ILivechatDepartmentAgents, 'agentId'>[];
		},
	) {
		check(_id, String);
		check(departmentAgents, {
			upsert: Match.Maybe([
				Match.ObjectIncluding({
					agentId: String,
					username: String,
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

		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'enabled'>>(_id, { projection: { enabled: 1 } });
		if (!department) {
			throw new Meteor.Error('error-department-not-found', 'Department not found');
		}

		return updateDepartmentAgents(_id, departmentAgents, department.enabled);
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

	/**
	 * @param {string|null} _id - The department id
	 * @param {Partial<import('@rocket.chat/core-typings').ILivechatDepartment>} departmentData
	 * @param {{upsert?: { agentId: string; count?: number; order?: number; }[], remove?: { agentId: string; count?: number; order?: number; }}} [departmentAgents] - The department agents
	 * @param {{_id?: string}} [departmentUnit] - The department's unit id
	 */
	async saveDepartment(
		userId: string,
		_id: string | null,
		departmentData: LivechatDepartmentDTO,
		departmentAgents?: {
			upsert?: { agentId: string; count?: number; order?: number }[];
			remove?: { agentId: string; count?: number; order?: number };
		},
		departmentUnit?: { _id?: string },
	) {
		check(_id, Match.Maybe(String));
		if (departmentUnit?._id !== undefined && typeof departmentUnit._id !== 'string') {
			throw new Meteor.Error('error-invalid-department-unit', 'Invalid department unit id provided', {
				method: 'livechat:saveDepartment',
			});
		}

		const department = _id
			? await LivechatDepartment.findOneById(_id, { projection: { _id: 1, archived: 1, enabled: 1, parentId: 1 } })
			: null;

		if (departmentUnit && !departmentUnit._id && department && department.parentId) {
			const isLastDepartmentInUnit = (await LivechatDepartment.countDepartmentsInUnit(department.parentId)) === 1;
			if (isLastDepartmentInUnit) {
				throw new Meteor.Error('error-unit-cant-be-empty', "The last department in a unit can't be removed", {
					method: 'livechat:saveDepartment',
				});
			}
		}

		if (!department && !(await isDepartmentCreationAvailable())) {
			throw new Meteor.Error('error-max-departments-number-reached', 'Maximum number of departments reached', {
				method: 'livechat:saveDepartment',
			});
		}

		if (department?.archived && departmentData.enabled) {
			throw new Meteor.Error('error-archived-department-cant-be-enabled', 'Archived departments cant be enabled', {
				method: 'livechat:saveDepartment',
			});
		}

		const defaultValidations: Record<string, Match.Matcher<any> | BooleanConstructor | StringConstructor> = {
			enabled: Boolean,
			name: String,
			description: Match.Optional(String),
			showOnRegistration: Boolean,
			email: String,
			showOnOfflineForm: Boolean,
			requestTagBeforeClosingChat: Match.Optional(Boolean),
			chatClosingTags: Match.Optional([String]),
			fallbackForwardDepartment: Match.Optional(String),
			departmentsAllowedToForward: Match.Optional([String]),
			allowReceiveForwardOffline: Match.Optional(Boolean),
		};

		// The Livechat Form department support addition/custom fields, so those fields need to be added before validating
		Object.keys(departmentData).forEach((field) => {
			if (!defaultValidations.hasOwnProperty(field)) {
				defaultValidations[field] = Match.OneOf(String, Match.Integer, Boolean);
			}
		});

		check(departmentData, defaultValidations);
		check(
			departmentAgents,
			Match.Maybe({
				upsert: Match.Maybe(Array),
				remove: Match.Maybe(Array),
			}),
		);

		const { requestTagBeforeClosingChat, chatClosingTags, fallbackForwardDepartment } = departmentData;
		if (requestTagBeforeClosingChat && (!chatClosingTags || chatClosingTags.length === 0)) {
			throw new Meteor.Error(
				'error-validating-department-chat-closing-tags',
				'At least one closing tag is required when the department requires tag(s) on closing conversations.',
				{ method: 'livechat:saveDepartment' },
			);
		}

		if (_id && !department) {
			throw new Meteor.Error('error-department-not-found', 'Department not found', {
				method: 'livechat:saveDepartment',
			});
		}

		if (fallbackForwardDepartment === _id) {
			throw new Meteor.Error(
				'error-fallback-department-circular',
				'Cannot save department. Circular reference between fallback department and department',
			);
		}

		if (fallbackForwardDepartment) {
			const fallbackDep = await LivechatDepartment.findOneById(fallbackForwardDepartment, {
				projection: { _id: 1, fallbackForwardDepartment: 1 },
			});
			if (!fallbackDep) {
				throw new Meteor.Error('error-fallback-department-not-found', 'Fallback department not found', {
					method: 'livechat:saveDepartment',
				});
			}
		}

		const departmentDB = await LivechatDepartment.createOrUpdateDepartment(_id, departmentData);
		if (departmentDB && departmentAgents) {
			await updateDepartmentAgents(departmentDB._id, departmentAgents, departmentDB.enabled);
		}

		// Disable event
		if (department?.enabled && !departmentDB?.enabled) {
			await callbacks.run('livechat.afterDepartmentDisabled', departmentDB);
		}

		if (departmentUnit) {
			await callbacks.run('livechat.manageDepartmentUnit', { userId, departmentId: departmentDB._id, unitId: departmentUnit._id });
		}

		return departmentDB;
	}
}

export const Livechat = new LivechatClass();
export * from './localTypes';

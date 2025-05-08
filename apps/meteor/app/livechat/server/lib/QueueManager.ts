import { Apps, AppEvents } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions/AppsEngineException';
import { Message, Omnichannel } from '@rocket.chat/core-services';
import type {
	ILivechatDepartment,
	IOmnichannelRoomInfo,
	IOmnichannelRoomExtraData,
	AtLeast,
	ILivechatInquiryRecord,
	ILivechatVisitor,
	IOmnichannelRoom,
	SelectedAgent,
} from '@rocket.chat/core-typings';
import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { LivechatContacts, LivechatDepartment, LivechatDepartmentAgents, LivechatInquiry, LivechatRooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { createLivechatRoom, createLivechatInquiry, allowAgentSkipQueue, prepareLivechatRoom } from './Helper';
import { RoutingManager } from './RoutingManager';
import { isVerifiedChannelInSource } from './contacts/isVerifiedChannelInSource';
import { checkOnlineAgents, getOnlineAgents } from './service-status';
import { getInquirySortMechanismSetting } from './settings';
import { dispatchInquiryPosition } from '../../../../ee/app/livechat-enterprise/server/lib/Helper';
import { callbacks } from '../../../../lib/callbacks';
import { client, shouldRetryTransaction } from '../../../../server/database/utils';
import { sendNotification } from '../../../lib/server';
import { notifyOnLivechatInquiryChangedById, notifyOnLivechatInquiryChanged } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { i18n } from '../../../utils/lib/i18n';
import { getOmniChatSortQuery } from '../../lib/inquiries';

const logger = new Logger('QueueManager');

export const saveQueueInquiry = async (inquiry: ILivechatInquiryRecord) => {
	const queuedInquiry = await LivechatInquiry.queueInquiry(inquiry._id);
	if (!queuedInquiry) {
		return;
	}

	await callbacks.run('livechat.afterInquiryQueued', queuedInquiry);

	void notifyOnLivechatInquiryChanged(queuedInquiry, 'updated', {
		status: LivechatInquiryStatus.QUEUED,
		queuedAt: new Date(),
		takenAt: undefined,
	});
};

/**
 *  @deprecated
 */
export const queueInquiry = async (inquiry: ILivechatInquiryRecord, defaultAgent?: SelectedAgent) => {
	const room = await LivechatRooms.findOneById(inquiry.rid, { projection: { v: 1 } });

	if (!room) {
		await saveQueueInquiry(inquiry);
		return;
	}

	return QueueManager.requeueInquiry(inquiry, room, defaultAgent);
};

const getDepartment = async (department: string): Promise<string | undefined> => {
	if (!department) {
		return;
	}

	if (await LivechatDepartmentAgents.checkOnlineForDepartment(department)) {
		return department;
	}

	const departmentDocument = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'fallbackForwardDepartment'>>(
		department,
		{
			projection: { fallbackForwardDepartment: 1 },
		},
	);

	if (departmentDocument?.fallbackForwardDepartment) {
		return getDepartment(departmentDocument.fallbackForwardDepartment);
	}
};

export class QueueManager {
	static async requeueInquiry(inquiry: ILivechatInquiryRecord, room: IOmnichannelRoom, defaultAgent?: SelectedAgent) {
		if (!(await Omnichannel.isWithinMACLimit(room))) {
			logger.error({ msg: 'MAC limit reached, not routing inquiry', inquiry });
			// We'll queue these inquiries so when new license is applied, they just start rolling again
			// Minimizing disruption
			await saveQueueInquiry(inquiry);
			return;
		}

		const inquiryAgent = await RoutingManager.delegateAgent(defaultAgent, inquiry);
		logger.debug(`Delegating inquiry with id ${inquiry._id} to agent ${defaultAgent?.username}`);
		const dbInquiry = await callbacks.run('livechat.beforeRouteChat', inquiry, inquiryAgent);

		if (!dbInquiry) {
			throw new Error('inquiry-not-found');
		}

		if (dbInquiry.status === 'ready') {
			logger.debug(`Inquiry with id ${inquiry._id} is ready. Delegating to agent ${inquiryAgent?.username}`);
			return RoutingManager.delegateInquiry(dbInquiry, inquiryAgent, undefined, room);
		}
	}

	private static fnQueueInquiryStatus: (typeof QueueManager)['getInquiryStatus'] | undefined;

	public static patchInquiryStatus(fn: (typeof QueueManager)['getInquiryStatus']) {
		this.fnQueueInquiryStatus = fn;
	}

	static async getInquiryStatus({ room, agent }: { room: IOmnichannelRoom; agent?: SelectedAgent }): Promise<LivechatInquiryStatus> {
		if (this.fnQueueInquiryStatus) {
			return this.fnQueueInquiryStatus({ room, agent });
		}

		const needVerification = ['once', 'always'].includes(settings.get<string>('Livechat_Require_Contact_Verification'));

		if (needVerification && !(await this.isRoomContactVerified(room))) {
			return LivechatInquiryStatus.VERIFYING;
		}

		if (!(await Omnichannel.isWithinMACLimit(room))) {
			return LivechatInquiryStatus.QUEUED;
		}

		// bots should be able to skip the queue and the routing check
		if (agent && (await allowAgentSkipQueue(agent))) {
			return LivechatInquiryStatus.READY;
		}

		if (settings.get('Livechat_waiting_queue')) {
			return LivechatInquiryStatus.QUEUED;
		}

		if (RoutingManager.getConfig()?.autoAssignAgent) {
			return LivechatInquiryStatus.READY;
		}

		if (settings.get('Livechat_Routing_Method') === 'Manual_Selection' && agent) {
			return LivechatInquiryStatus.QUEUED;
		}

		if (!agent) {
			return LivechatInquiryStatus.QUEUED;
		}

		return LivechatInquiryStatus.READY;
	}

	static async processNewInquiry(inquiry: ILivechatInquiryRecord, room: IOmnichannelRoom, defaultAgent?: SelectedAgent | null) {
		if (inquiry.status === LivechatInquiryStatus.VERIFYING) {
			logger.debug({ msg: 'Inquiry is waiting for contact verification. Ignoring it', inquiry, defaultAgent });

			if (defaultAgent) {
				await LivechatInquiry.setDefaultAgentById(inquiry._id, defaultAgent);
			}
			return;
		}

		if (inquiry.status === LivechatInquiryStatus.READY) {
			logger.debug({ msg: 'Inquiry is ready. Delegating', inquiry, defaultAgent });
			return RoutingManager.delegateInquiry(inquiry, defaultAgent, undefined, room);
		}

		if (inquiry.status === LivechatInquiryStatus.QUEUED) {
			await callbacks.run('livechat.afterInquiryQueued', inquiry);
			await callbacks.run('livechat.chatQueued', room);

			if (defaultAgent) {
				logger.debug(`Setting default agent for inquiry ${inquiry._id} to ${defaultAgent.username}`);
				await LivechatInquiry.setDefaultAgentById(inquiry._id, defaultAgent);
			}

			return this.dispatchInquiryQueued(inquiry, room, defaultAgent);
		}
	}

	static async verifyInquiry(inquiry: ILivechatInquiryRecord, room: IOmnichannelRoom) {
		if (inquiry.status !== LivechatInquiryStatus.VERIFYING) {
			return;
		}

		const { defaultAgent: agent } = inquiry;

		const newStatus = await QueueManager.getInquiryStatus({ room, agent });

		if (newStatus === inquiry.status) {
			throw new Error('error-failed-to-verify-inquiry');
		}

		const newInquiry = await LivechatInquiry.setStatusById(inquiry._id, newStatus);

		await this.processNewInquiry(newInquiry, room, agent);

		const newRoom = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id' | 'servedBy' | 'departmentId'>>(room._id, {
			projection: { servedBy: 1, departmentId: 1 },
		});

		if (!newRoom) {
			logger.error(`Room with id ${room._id} not found after inquiry verification.`);
			throw new Error('room-not-found');
		}

		await this.dispatchInquiryPosition(inquiry, newRoom);
	}

	static async isRoomContactVerified(room: IOmnichannelRoom): Promise<boolean> {
		if (!room.contactId) {
			return false;
		}

		const contact = await LivechatContacts.findOneById(room.contactId, { projection: { channels: 1 } });
		if (!contact) {
			return false;
		}

		return Boolean(contact.channels.some((channel) => isVerifiedChannelInSource(channel, room.v._id, room.source)));
	}

	static async startConversation(
		rid: string,
		insertionRoom: InsertionModel<IOmnichannelRoom>,
		guest: ILivechatVisitor,
		roomInfo: IOmnichannelRoomInfo,
		defaultAgent?: SelectedAgent,
		message?: string,
		extraData?: IOmnichannelRoomExtraData,
		attempts = 3,
	): Promise<{ room: IOmnichannelRoom; inquiry: ILivechatInquiryRecord }> {
		const session = client.startSession();
		try {
			session.startTransaction();
			const room = await createLivechatRoom(insertionRoom, session);
			logger.debug(`Room for visitor ${guest._id} created with id ${room._id}`);
			const inquiry = await createLivechatInquiry({
				rid,
				name: room.fname,
				initialStatus: await this.getInquiryStatus({ room, agent: defaultAgent }),
				guest,
				message,
				extraData: { ...extraData, source: roomInfo.source },
				session,
			});
			await session.commitTransaction();
			return { room, inquiry };
		} catch (e) {
			await session.abortTransaction();
			if (shouldRetryTransaction(e)) {
				if (attempts > 0) {
					logger.debug({ msg: 'Retrying transaction because of transient error', attemptsLeft: attempts });
					return this.startConversation(rid, insertionRoom, guest, roomInfo, defaultAgent, message, extraData, attempts - 1);
				}
				throw new Error('error-failed-to-start-conversation');
			}
			throw e;
		} finally {
			await session.endSession();
		}
	}

	static async requestRoom({
		guest,
		rid = Random.id(),
		message,
		roomInfo,
		agent,
		extraData: { customFields, ...extraData } = {},
	}: {
		guest: ILivechatVisitor;
		rid?: string;
		message?: string;
		roomInfo: IOmnichannelRoomInfo;
		agent?: SelectedAgent;
		extraData?: IOmnichannelRoomExtraData;
	}) {
		logger.debug(`Requesting a room for guest ${guest._id}`);
		check(
			guest,
			Match.ObjectIncluding({
				_id: String,
				username: String,
				status: Match.Maybe(String),
				department: Match.Maybe(String),
				name: Match.Maybe(String),
				activity: Match.Maybe([String]),
			}),
		);

		const defaultAgent =
			(await callbacks.run('livechat.beforeDelegateAgent', agent, {
				department: guest.department,
			})) || undefined;

		const department = guest.department && (await getDepartment(guest.department));

		/**
		 * we have 4 cases here
		 * 1. agent and no department
		 * 2. no agent and no department
		 * 3. no agent and department
		 * 4. agent and department informed
		 *
		 * in case 1, we check if the agent is online
		 * in case 2, we check if there is at least one online agent in the whole service
		 * in case 3, we check if there is at least one online agent in the department
		 *
		 * the case 4 is weird, but we are not throwing an error, just because the application works in some mysterious way
		 * we don't have explicitly defined what to do in this case so we just kept the old behavior
		 * it seems that agent has priority over department
		 * but some cases department is handled before agent
		 *
		 */

		if (!settings.get('Livechat_accept_chats_with_no_agents')) {
			if (agent && !defaultAgent) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}

			if (!defaultAgent && guest.department && !department) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}

			if (!agent && !guest.department && !(await checkOnlineAgents())) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}
		}

		const insertionRoom = await prepareLivechatRoom(rid, { ...guest, ...(department && { department }) }, roomInfo, {
			...extraData,
			...(Boolean(customFields) && { customFields }),
		});

		try {
			await Apps.self?.triggerEvent(AppEvents.IPreLivechatRoomCreatePrevent, insertionRoom);
		} catch (error: any) {
			if (error.name === AppsEngineException.name) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}

		// Transactional start of the conversation. This should prevent rooms from being created without inquiries and viceversa.
		// All the actions that happened inside createLivechatRoom are now outside this transaction
		const { room, inquiry } = await this.startConversation(rid, insertionRoom, guest, roomInfo, defaultAgent, message, extraData);

		await callbacks.run('livechat.newRoom', room);
		await Message.saveSystemMessageAndNotifyUser(
			'livechat-started',
			rid,
			'',
			{ _id: guest._id, username: guest.username },
			{ groupable: false, token: guest.token },
		);
		void Apps.self?.triggerEvent(AppEvents.IPostLivechatRoomStarted, room);

		await this.processNewInquiry(inquiry, room, defaultAgent);
		const newRoom = await LivechatRooms.findOneById(rid);

		if (!newRoom) {
			logger.error(`Room with id ${rid} not found`);
			throw new Error('room-not-found');
		}

		await this.dispatchInquiryPosition(inquiry, newRoom);
		return newRoom;
	}

	static async dispatchInquiryPosition(
		inquiry: ILivechatInquiryRecord,
		room: AtLeast<IOmnichannelRoom, 'servedBy' | 'departmentId'>,
	): Promise<void> {
		if (
			!room.servedBy &&
			inquiry.status !== LivechatInquiryStatus.VERIFYING &&
			settings.get('Livechat_waiting_queue') &&
			settings.get('Omnichannel_calculate_dispatch_service_queue_statistics')
		) {
			const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({
				inquiryId: inquiry._id,
				department: room.departmentId,
				queueSortBy: getOmniChatSortQuery(getInquirySortMechanismSetting()),
			});

			if (inq) {
				void dispatchInquiryPosition(inq);
			}
		}
	}

	static async unarchiveRoom(archivedRoom: IOmnichannelRoom) {
		if (!archivedRoom) {
			throw new Error('no-room-to-unarchive');
		}

		const { _id: rid, open, closedAt, fname: name, servedBy, v, departmentId: department, lastMessage: message, source } = archivedRoom;

		if (!rid || !closedAt || !!open) {
			return archivedRoom;
		}

		logger.debug(`Attempting to unarchive room with id ${rid}`);

		const oldInquiry = await LivechatInquiry.findOneByRoomId<Pick<ILivechatInquiryRecord, '_id'>>(rid, { projection: { _id: 1 } });
		if (oldInquiry) {
			logger.debug(`Removing old inquiry (${oldInquiry._id}) for room ${rid}`);
			await LivechatInquiry.removeByRoomId(rid);
			void notifyOnLivechatInquiryChangedById(oldInquiry._id, 'removed');
		}

		const guest = {
			...v,
			...(department && { department }),
		};

		let defaultAgent: SelectedAgent | undefined;
		if (servedBy?.username && (await Users.findOneOnlineAgentByUserList(servedBy.username))) {
			defaultAgent = { agentId: servedBy._id, username: servedBy.username };
		}

		await LivechatRooms.unarchiveOneById(rid);
		const room = await LivechatRooms.findOneById(rid);
		if (!room) {
			throw new Error('room-not-found');
		}
		const inquiry = await createLivechatInquiry({
			rid,
			name,
			guest,
			message: message?.msg,
			extraData: { source },
		});
		if (!inquiry) {
			throw new Error('inquiry-not-found');
		}

		await this.requeueInquiry(inquiry, room, defaultAgent);
		logger.debug(`Inquiry ${inquiry._id} queued`);

		return room;
	}

	private static dispatchInquiryQueued = async (inquiry: ILivechatInquiryRecord, room: IOmnichannelRoom, agent?: SelectedAgent | null) => {
		if (RoutingManager.getConfig()?.autoAssignAgent) {
			return;
		}

		logger.debug(`Notifying agents of new inquiry ${inquiry._id} queued`);

		const { department, rid, v } = inquiry;
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
				room: { ...room, name: i18n.t('New_chat_in_queue', { lng: language }) },
				mentionIds: [],
			});
		}
	};
}

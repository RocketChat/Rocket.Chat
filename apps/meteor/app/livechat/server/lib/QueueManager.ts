import { Apps, AppEvents } from '@rocket.chat/apps';
import { Omnichannel } from '@rocket.chat/core-services';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import {
	LivechatInquiryStatus,
	type ILivechatInquiryRecord,
	type ILivechatVisitor,
	type IOmnichannelRoom,
	type SelectedAgent,
	type OmnichannelSourceType,
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatDepartment, LivechatDepartmentAgents, LivechatInquiry, LivechatRooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { dispatchInquiryPosition } from '../../../../ee/app/livechat-enterprise/server/lib/Helper';
import { callbacks } from '../../../../lib/callbacks';
import { sendNotification } from '../../../lib/server';
import {
	notifyOnLivechatInquiryChangedById,
	notifyOnLivechatInquiryChanged,
	notifyOnSettingChanged,
} from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { i18n } from '../../../utils/lib/i18n';
import { createLivechatRoom, createLivechatInquiry, allowAgentSkipQueue } from './Helper';
import { Livechat } from './LivechatTyped';
import { RoutingManager } from './RoutingManager';
import { getInquirySortMechanismSetting } from './settings';

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
		await callbacks.run('livechat.beforeRouteChat', inquiry, inquiryAgent);
		const dbInquiry = await LivechatInquiry.findOneById(inquiry._id);

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

		if (!(await Omnichannel.isWithinMACLimit(room))) {
			return LivechatInquiryStatus.QUEUED;
		}

		if (RoutingManager.getConfig()?.autoAssignAgent) {
			return LivechatInquiryStatus.READY;
		}

		if (!agent || !(await allowAgentSkipQueue(agent))) {
			return LivechatInquiryStatus.QUEUED;
		}

		return LivechatInquiryStatus.READY;
	}

	static async queueInquiry(inquiry: ILivechatInquiryRecord, room: IOmnichannelRoom, defaultAgent?: SelectedAgent | null) {
		if (inquiry.status === 'ready') {
			return RoutingManager.delegateInquiry(inquiry, defaultAgent, undefined, room);
		}

		await callbacks.run('livechat.afterInquiryQueued', inquiry);

		void callbacks.run('livechat.chatQueued', room);

		await this.dispatchInquiryQueued(inquiry, room, defaultAgent);
	}

	static async requestRoom<
		E extends Record<string, unknown> & {
			sla?: string;
			customFields?: Record<string, unknown>;
			source?: OmnichannelSourceType;
		},
	>({
		guest,
		rid = Random.id(),
		message,
		roomInfo,
		agent,
		extraData: { customFields, ...extraData } = {} as E,
	}: {
		guest: ILivechatVisitor;
		rid?: string;
		message?: string;
		roomInfo: {
			source?: IOmnichannelRoom['source'];
			[key: string]: unknown;
		};
		agent?: SelectedAgent;
		extraData?: E;
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

			if (!agent && !guest.department && !(await Livechat.checkOnlineAgents())) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}
		}

		const name = (roomInfo?.fname as string) || guest.name || guest.username;

		const room = await createLivechatRoom(rid, name, { ...guest, ...(department && { department }) }, roomInfo, {
			...extraData,
			...(Boolean(customFields) && { customFields }),
		});

		if (!room) {
			logger.error(`Room for visitor ${guest._id} not found`);
			throw new Error('room-not-found');
		}
		logger.debug(`Room for visitor ${guest._id} created with id ${room._id}`);

		const inquiry = await createLivechatInquiry({
			rid,
			name,
			initialStatus: await this.getInquiryStatus({ room, agent: defaultAgent }),
			guest,
			message,
			extraData: { ...extraData, source: roomInfo.source },
		});

		if (!inquiry) {
			logger.error(`Inquiry for visitor ${guest._id} not found`);
			throw new Error('inquiry-not-found');
		}

		void Apps.self?.triggerEvent(AppEvents.IPostLivechatRoomStarted, room);

		const livechatSetting = await LivechatRooms.updateRoomCount();
		if (livechatSetting) {
			void notifyOnSettingChanged(livechatSetting);
		}

		const newRoom = (await this.queueInquiry(inquiry, room, defaultAgent)) ?? (await LivechatRooms.findOneById(rid));
		if (!newRoom) {
			logger.error(`Room with id ${rid} not found`);
			throw new Error('room-not-found');
		}

		if (!newRoom.servedBy && settings.get('Omnichannel_calculate_dispatch_service_queue_statistics')) {
			const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({
				inquiryId: inquiry._id,
				department,
				queueSortBy: getInquirySortMechanismSetting(),
			});

			if (inq) {
				void dispatchInquiryPosition(inq);
			}
		}

		return newRoom;
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
		logger.debug(`Notifying agents of new inquiry ${inquiry._id} queued`);

		const { department, rid, v } = inquiry;
		// Alert only the online agents of the queued request
		const onlineAgents = await Livechat.getOnlineAgents(department, agent);

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
				room: { ...room, name: i18n.t('New_chat_in_queue', {}, language) },
				mentionIds: [],
			});
		}
	};
}

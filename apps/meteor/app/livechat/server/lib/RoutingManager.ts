import { Apps, AppEvents } from '@rocket.chat/apps';
import { Message } from '@rocket.chat/core-services';
import type {
	ILivechatInquiryRecord,
	ILivechatVisitor,
	IOmnichannelRoom,
	IRoutingMethod,
	IRoutingMethodConstructor,
	RoutingMethodConfig,
	SelectedAgent,
	InquiryWithAgentInfo,
	TransferData,
	IUser,
} from '@rocket.chat/core-typings';
import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatInquiry, LivechatRooms, Subscriptions, Rooms, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import {
	createLivechatSubscription,
	dispatchAgentDelegated,
	dispatchInquiryQueued,
	forwardRoomToAgent,
	forwardRoomToDepartment,
	removeAgentFromSubscription,
	updateChatDepartment,
	allowAgentSkipQueue,
} from './Helper';
import { afterTakeInquiry, beforeDelegateAgent } from './hooks';
import { callbacks } from '../../../../server/lib/callbacks';
import { notifyOnLivechatInquiryChangedById, notifyOnLivechatInquiryChanged } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';

const logger = new Logger('RoutingManager');

type Routing = {
	methods: Record<string, IRoutingMethod>;
	isMethodSet(): boolean;
	registerMethod(name: string, Method: IRoutingMethodConstructor): void;
	getMethod(): IRoutingMethod;
	getConfig(): RoutingMethodConfig | undefined;
	getNextAgent(department?: string, ignoreAgentId?: string): Promise<SelectedAgent | null | undefined>;
	delegateInquiry(
		inquiry: InquiryWithAgentInfo,
		agent?: SelectedAgent | null,
		options?: { clientAction?: boolean; forwardingToDepartment?: { oldDepartmentId?: string; transferData?: any } },
		room?: IOmnichannelRoom,
	): Promise<(IOmnichannelRoom & { chatQueued?: boolean }) | null | false>;
	unassignAgent(
		inquiry: ILivechatInquiryRecord,
		departmentId?: string,
		shouldQueue?: boolean,
		agent?: SelectedAgent | null,
	): Promise<boolean>;
	takeInquiry(
		inquiry: Omit<
			ILivechatInquiryRecord,
			'estimatedInactivityCloseTimeAt' | 'message' | 't' | 'source' | 'estimatedWaitingTimeQueue' | 'priorityWeight' | '_updatedAt'
		>,
		agent: SelectedAgent | null,
		options: { clientAction?: boolean; forwardingToDepartment?: { oldDepartmentId?: string; transferData?: any } },
		room: IOmnichannelRoom,
	): Promise<IOmnichannelRoom | false>;
	transferRoom(room: IOmnichannelRoom, guest: ILivechatVisitor, transferData: TransferData): Promise<boolean>;
	delegateAgent(agent: SelectedAgent | undefined, inquiry: ILivechatInquiryRecord): Promise<SelectedAgent | null | undefined>;
	removeAllRoomSubscriptions(room: Pick<IOmnichannelRoom, '_id'>, ignoreUser?: { _id: string }): Promise<void>;

	assignAgent(inquiry: InquiryWithAgentInfo, agent: SelectedAgent): Promise<{ inquiry: InquiryWithAgentInfo; user: IUser }>;
	conditionalLockAgent(
		agentId: string,
		lockTime: Date,
	): Promise<{
		acquired: boolean;
		required: boolean;
		unlock: () => Promise<void>;
	}>;
};

export const RoutingManager: Routing = {
	methods: {},

	isMethodSet() {
		return settings.get<string>('Livechat_Routing_Method') !== '';
	},

	// eslint-disable-next-line @typescript-eslint/naming-convention
	registerMethod(name, Method) {
		this.methods[name] = new Method();
	},

	getMethod() {
		const setting = settings.get<string>('Livechat_Routing_Method');
		if (!this.methods[setting]) {
			throw new Meteor.Error('error-routing-method-not-available');
		}
		return this.methods[setting];
	},

	getConfig() {
		return this.getMethod().config;
	},

	async getNextAgent(department, ignoreAgentId) {
		logger.debug({
			msg: 'Getting next available agent with method',
			routingMethod: settings.get('Livechat_Routing_Method'),
			department,
			ignoreAgentId,
		});
		return this.getMethod().getNextAgent(department, ignoreAgentId);
	},

	async delegateInquiry(inquiry, agent, options = {}, room) {
		const { department, rid } = inquiry;
		logger.debug({ msg: 'Attempting to delegate inquiry', inquiryId: inquiry._id });
		if (
			!agent ||
			(agent.username &&
				!(await Users.findOneOnlineAgentByUserList(agent.username, {}, settings.get<boolean>('Livechat_enabled_when_agent_idle'))) &&
				!(await allowAgentSkipQueue(agent)))
		) {
			logger.debug({ msg: 'Agent offline or invalid. Using routing method to get next agent', inquiryId: inquiry._id });
			agent = await this.getNextAgent(department);
			logger.debug({ msg: 'Routing method returned agent for inquiry', inquiryId: inquiry._id, agentId: agent?.agentId });
		}

		if (!agent) {
			logger.debug({ msg: 'No agents available. Unable to delegate inquiry', inquiryId: inquiry._id });
			// When an inqury reaches here on CE, it will stay here as 'ready' since on CE there's no mechanism to re queue it.
			// When reaching this point, managers have to manually transfer the inquiry to another room. This is expected.
			return LivechatRooms.findOneById(rid);
		}

		if (!room) {
			throw new Meteor.Error('error-invalid-room');
		}

		logger.debug({ msg: 'Inquiry will be taken by agent', inquiryId: inquiry._id, agentId: agent.agentId });
		return this.takeInquiry(inquiry, agent, options, room);
	},

	async assignAgent(inquiry: InquiryWithAgentInfo, agent: SelectedAgent): Promise<{ inquiry: InquiryWithAgentInfo; user: IUser }> {
		check(
			agent,
			Match.ObjectIncluding({
				agentId: String,
				username: String,
			}),
		);

		logger.debug({ msg: 'Assigning agent to inquiry', agentId: agent.agentId, inquiryId: inquiry._id });

		const { rid, name, v, department } = inquiry;
		if (!(await createLivechatSubscription(rid, name, v, agent, department))) {
			logger.debug({ msg: 'Cannot assign agent to inquiry. Cannot create subscription', inquiryId: inquiry._id, agentId: agent.agentId });
			throw new Meteor.Error('error-creating-subscription', 'Error creating subscription');
		}

		await LivechatRooms.changeAgentByRoomId(rid, agent);
		await Rooms.incUsersCountById(rid, 1);

		const user = await Users.findOneById(agent.agentId);
		if (!user) {
			throw new Error('error-user-not-found');
		}

		await Promise.all([Message.saveSystemMessage('command', rid, 'connected', user), Message.saveSystemMessage('uj', rid, '', user)]);

		await dispatchAgentDelegated(rid, agent.agentId);

		logger.debug({ msg: 'Agent assigned to inquiry. Instances notified', agentId: agent.agentId, inquiryId: inquiry._id });

		return { inquiry, user };
	},

	async unassignAgent(inquiry, departmentId, shouldQueue = false, defaultAgent?: SelectedAgent | null) {
		const { rid, department } = inquiry;
		const room = await LivechatRooms.findOneById(rid);

		logger.debug({
			msg: 'Removing assignations of inquiry',
			inquiryId: inquiry._id,
			departmentId,
			room: { _id: room?._id, open: room?.open, servedBy: room?.servedBy },
			shouldQueue,
			defaultAgent,
		});

		if (!room?.open) {
			logger.debug({ msg: 'Cannot unassign agent from inquiry. Room already closed', inquiryId: inquiry._id });
			return false;
		}

		if (departmentId && departmentId !== department) {
			logger.debug({
				msg: 'Switching department for inquiry',
				inquiryId: inquiry._id,
				currentDepartment: department,
				nextDepartment: departmentId,
			});
			await updateChatDepartment({
				rid,
				newDepartmentId: departmentId,
				oldDepartmentId: department,
			});
			// Fake the department to delegate the inquiry;
			inquiry.department = departmentId;
		}

		const { servedBy } = room;

		if (servedBy) {
			await LivechatRooms.removeAgentByRoomId(rid);
			await this.removeAllRoomSubscriptions(room);
			await dispatchAgentDelegated(rid);
		}

		if (shouldQueue) {
			const queuedInquiry = await LivechatInquiry.queueInquiry(inquiry._id, room.lastMessage, defaultAgent);
			if (queuedInquiry) {
				inquiry = queuedInquiry;
				void notifyOnLivechatInquiryChanged(inquiry, 'updated', {
					status: LivechatInquiryStatus.QUEUED,
					queuedAt: new Date(),
					takenAt: undefined,
				});
			}
		}

		await dispatchInquiryQueued(inquiry);

		return true;
	},

	async conditionalLockAgent(
		agentId: string,
		lockTime: Date,
	): Promise<{
		acquired: boolean;
		required: boolean;
		unlock: () => Promise<void>;
	}> {
		// chat limits is only required when waiting queue is enabled
		const shouldLock = settings.get<boolean>('Livechat_waiting_queue');

		if (!shouldLock) {
			return {
				acquired: false,
				required: false,
				unlock: async () => {
					// no-op
				},
			};
		}

		const lockAcquired = await Users.acquireAgentLock(agentId, lockTime);

		return {
			acquired: !!lockAcquired,
			required: true,
			unlock: async () => {
				await Users.releaseAgentLock(agentId, lockTime);
			},
		};
	},

	async takeInquiry(inquiry, agent, options = { clientAction: false }, room) {
		check(
			agent,
			Match.ObjectIncluding({
				agentId: String,
				username: String,
			}),
		);

		check(
			inquiry,
			Match.ObjectIncluding({
				_id: String,
				rid: String,
				status: String,
			}),
		);

		logger.debug({ msg: 'Attempting to take Inquiry', inquiryId: inquiry._id, agentId: agent.agentId });

		const { _id, rid } = inquiry;
		if (!room?.open) {
			logger.debug({ msg: 'Cannot take inquiry. Room is closed', inquiryId: inquiry._id });
			return room;
		}

		if (room.servedBy && room.servedBy._id === agent.agentId) {
			logger.debug({ msg: 'Cannot take inquiry. Already taken by agent', inquiryId: inquiry._id, agentId: room.servedBy._id });
			return room;
		}

		const lock = await this.conditionalLockAgent(agent.agentId, new Date());
		if (!lock.acquired && lock.required) {
			logger.debug({
				msg: 'Cannot take inquiry because agent is currently locked by another process',
				agentId: agent.agentId,
				inquiryId: _id,
			});
			if (options.clientAction && !options.forwardingToDepartment) {
				throw new Error('error-agent-is-locked');
			}
			agent = null;
		}

		if (agent) {
			try {
				await callbacks.run('livechat.checkAgentBeforeTakeInquiry', {
					agent,
					inquiry,
					options,
				});
			} catch (e) {
				await lock.unlock();
				if (options.clientAction && !options.forwardingToDepartment) {
					throw e;
				}
				agent = null;
			}
		}

		if (!agent) {
			logger.debug({ msg: 'Cannot take inquiry. Precondition failed for agent', inquiryId: inquiry._id });
			const cbRoom = await callbacks.run<'livechat.onAgentAssignmentFailed'>('livechat.onAgentAssignmentFailed', room, {
				inquiry,
				options,
			});
			return cbRoom;
		}

		try {
			const result = await LivechatInquiry.takeInquiry(_id, inquiry.lockedAt);
			if (result.modifiedCount === 0) {
				logger.error({ msg: 'Failed to take inquiry because lockedAt did not match', inquiryId: _id, lockedAt: inquiry.lockedAt });
				throw new Error('error-taking-inquiry-lockedAt-mismatch');
			}

			logger.info({ msg: 'Inquiry taken', inquiryId: _id, agentId: agent.agentId });

			// assignAgent changes the room data to add the agent serving the conversation. afterTakeInquiry expects room object to be updated
			const { inquiry: returnedInquiry, user } = await this.assignAgent(inquiry, agent);
			const roomAfterUpdate = await LivechatRooms.findOneById(rid);

			if (!roomAfterUpdate) {
				// This should never happen
				throw new Error('error-room-not-found');
			}

			void Apps.self?.triggerEvent(AppEvents.IPostLivechatAgentAssigned, { room: roomAfterUpdate, user });
			void afterTakeInquiry({ inquiry: returnedInquiry, room: roomAfterUpdate, agent });

			void notifyOnLivechatInquiryChangedById(inquiry._id, 'updated', {
				status: LivechatInquiryStatus.TAKEN,
				takenAt: new Date(),
				defaultAgent: undefined,
				estimatedInactivityCloseTimeAt: undefined,
				queuedAt: undefined,
			});

			return roomAfterUpdate;
		} finally {
			await lock.unlock();
		}
	},

	async transferRoom(room, guest, transferData) {
		logger.debug({ msg: 'Transferring room', roomId: room._id, transferredBy: transferData.transferredBy._id });
		if (transferData.departmentId) {
			logger.debug({ msg: 'Transferring room to department', roomId: room._id, departmentId: transferData.departmentId });
			return forwardRoomToDepartment(room, guest, transferData);
		}

		if (transferData.userId) {
			logger.debug({ msg: 'Transferring room to user', roomId: room._id, userId: transferData.userId });
			return forwardRoomToAgent(room, transferData);
		}

		logger.debug({ msg: 'Unable to transfer room. No target provided', roomId: room._id });
		return false;
	},

	async delegateAgent(agent, inquiry) {
		const defaultAgent = await beforeDelegateAgent(agent, {
			department: inquiry?.department,
		});

		if (defaultAgent) {
			logger.debug({ msg: 'Delegating Inquiry to agent', inquiryId: inquiry._id, agentUsername: defaultAgent.username });
			await LivechatInquiry.setDefaultAgentById(inquiry._id, defaultAgent);
			void notifyOnLivechatInquiryChanged(inquiry, 'updated', { defaultAgent });
		}

		logger.debug({ msg: 'Queueing inquiry', inquiryId: inquiry._id });
		await dispatchInquiryQueued(inquiry, defaultAgent);
		return defaultAgent;
	},

	async removeAllRoomSubscriptions(room, ignoreUser) {
		const { _id: roomId } = room;

		const subscriptions = await Subscriptions.findByRoomId(roomId).toArray();
		subscriptions?.forEach(({ u }) => {
			if (ignoreUser && ignoreUser._id === u._id) {
				return;
			}
			void removeAgentFromSubscription(roomId, u);
		});
	},
};

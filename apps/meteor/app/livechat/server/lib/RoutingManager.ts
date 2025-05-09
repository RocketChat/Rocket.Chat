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
import { callbacks } from '../../../../lib/callbacks';
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
	): Promise<(IOmnichannelRoom & { chatQueued?: boolean }) | null | void>;
	unassignAgent(inquiry: ILivechatInquiryRecord, departmentId?: string, shouldQueue?: boolean): Promise<boolean>;
	takeInquiry(
		inquiry: Omit<
			ILivechatInquiryRecord,
			'estimatedInactivityCloseTimeAt' | 'message' | 't' | 'source' | 'estimatedWaitingTimeQueue' | 'priorityWeight' | '_updatedAt'
		>,
		agent: SelectedAgent | null,
		options: { clientAction?: boolean; forwardingToDepartment?: { oldDepartmentId?: string; transferData?: any } },
		room: IOmnichannelRoom,
	): Promise<IOmnichannelRoom | null | void>;
	transferRoom(room: IOmnichannelRoom, guest: ILivechatVisitor, transferData: TransferData): Promise<boolean>;
	delegateAgent(agent: SelectedAgent | undefined, inquiry: ILivechatInquiryRecord): Promise<SelectedAgent | null | undefined>;
	removeAllRoomSubscriptions(room: Pick<IOmnichannelRoom, '_id'>, ignoreUser?: { _id: string }): Promise<void>;

	assignAgent(inquiry: InquiryWithAgentInfo, agent: SelectedAgent): Promise<{ inquiry: InquiryWithAgentInfo; user: IUser }>;
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
		logger.debug(`Getting next available agent with method ${settings.get('Livechat_Routing_Method')}`);
		return this.getMethod().getNextAgent(department, ignoreAgentId);
	},

	async delegateInquiry(inquiry, agent, options = {}, room) {
		const { department, rid } = inquiry;
		logger.debug(`Attempting to delegate inquiry ${inquiry._id}`);
		if (!agent || (agent.username && !(await Users.findOneOnlineAgentByUserList(agent.username)) && !(await allowAgentSkipQueue(agent)))) {
			logger.debug(`Agent offline or invalid. Using routing method to get next agent for inquiry ${inquiry._id}`);
			agent = await this.getNextAgent(department);
			logger.debug(`Routing method returned agent ${agent?.agentId} for inquiry ${inquiry._id}`);
		}

		if (!agent) {
			logger.debug(`No agents available. Unable to delegate inquiry ${inquiry._id}`);
			// When an inqury reaches here on CE, it will stay here as 'ready' since on CE there's no mechanism to re queue it.
			// When reaching this point, managers have to manually transfer the inquiry to another room. This is expected.
			return LivechatRooms.findOneById(rid);
		}

		if (!room) {
			throw new Meteor.Error('error-invalid-room');
		}

		logger.debug(`Inquiry ${inquiry._id} will be taken by agent ${agent.agentId}`);
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

		logger.debug(`Assigning agent ${agent.agentId} to inquiry ${inquiry._id}`);

		const { rid, name, v, department } = inquiry;
		if (!(await createLivechatSubscription(rid, name, v, agent, department))) {
			logger.debug(`Cannot assign agent to inquiry ${inquiry._id}: Cannot create subscription`);
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

		logger.debug(`Agent ${agent.agentId} assigned to inquiry ${inquiry._id}. Instances notified`);

		return { inquiry, user };
	},

	async unassignAgent(inquiry, departmentId, shouldQueue = false) {
		const { rid, department } = inquiry;
		const room = await LivechatRooms.findOneById(rid);

		logger.debug(`Removing assignations of inquiry ${inquiry._id}`);
		if (!room?.open) {
			logger.debug(`Cannot unassign agent from inquiry ${inquiry._id}: Room already closed`);
			return false;
		}

		if (departmentId && departmentId !== department) {
			logger.debug(`Switching department for inquiry ${inquiry._id} [Current: ${department} | Next: ${departmentId}]`);
			await updateChatDepartment({
				rid,
				newDepartmentId: departmentId,
				oldDepartmentId: department,
			});
			// Fake the department to delegate the inquiry;
			inquiry.department = departmentId;
		}

		const { servedBy } = room;

		if (shouldQueue) {
			const queuedInquiry = await LivechatInquiry.queueInquiry(inquiry._id, room.lastMessage);
			if (queuedInquiry) {
				inquiry = queuedInquiry;
				void notifyOnLivechatInquiryChanged(inquiry, 'updated', {
					status: LivechatInquiryStatus.QUEUED,
					queuedAt: new Date(),
					takenAt: undefined,
				});
			}
		}

		if (servedBy) {
			await LivechatRooms.removeAgentByRoomId(rid);
			await this.removeAllRoomSubscriptions(room);
			await dispatchAgentDelegated(rid);
		}

		await dispatchInquiryQueued(inquiry);

		return true;
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

		logger.debug(`Attempting to take Inquiry ${inquiry._id} [Agent ${agent.agentId}] `);

		const { _id, rid } = inquiry;
		if (!room?.open) {
			logger.debug(`Cannot take Inquiry ${inquiry._id}: Room is closed`);
			return room;
		}

		if (room.servedBy && room.servedBy._id === agent.agentId) {
			logger.debug(`Cannot take Inquiry ${inquiry._id}: Already taken by agent ${room.servedBy._id}`);
			return room;
		}

		try {
			await callbacks.run('livechat.checkAgentBeforeTakeInquiry', {
				agent,
				inquiry,
				options,
			});
		} catch (e) {
			if (options.clientAction && !options.forwardingToDepartment) {
				throw e;
			}
			agent = null;
		}

		if (!agent) {
			logger.debug(`Cannot take Inquiry ${inquiry._id}: Precondition failed for agent`);
			const cbRoom = await callbacks.run<'livechat.onAgentAssignmentFailed'>('livechat.onAgentAssignmentFailed', room, {
				inquiry,
				options,
			});
			return cbRoom;
		}

		await LivechatInquiry.takeInquiry(_id);

		logger.info(`Inquiry ${inquiry._id} taken by agent ${agent.agentId}`);

		// assignAgent changes the room data to add the agent serving the conversation. afterTakeInquiry expects room object to be updated
		const { inquiry: returnedInquiry, user } = await this.assignAgent(inquiry as InquiryWithAgentInfo, agent);
		const roomAfterUpdate = await LivechatRooms.findOneById(rid);

		if (!roomAfterUpdate) {
			// This should never happen
			throw new Error('error-room-not-found');
		}

		void Apps.self?.getBridges()?.getListenerBridge().livechatEvent(AppEvents.IPostLivechatAgentAssigned, { room: roomAfterUpdate, user });
		callbacks.runAsync(
			'livechat.afterTakeInquiry',
			{
				inquiry: returnedInquiry,
				room: roomAfterUpdate,
			},
			agent,
		);

		void notifyOnLivechatInquiryChangedById(inquiry._id, 'updated', {
			status: LivechatInquiryStatus.TAKEN,
			takenAt: new Date(),
			defaultAgent: undefined,
			estimatedInactivityCloseTimeAt: undefined,
			queuedAt: undefined,
		});

		return roomAfterUpdate;
	},

	async transferRoom(room, guest, transferData) {
		logger.debug(`Transfering room ${room._id} by ${transferData.transferredBy._id}`);
		if (transferData.departmentId) {
			logger.debug(`Transfering room ${room._id} to department ${transferData.departmentId}`);
			return forwardRoomToDepartment(room, guest, transferData);
		}

		if (transferData.userId) {
			logger.debug(`Transfering room ${room._id} to user ${transferData.userId}`);
			return forwardRoomToAgent(room, transferData);
		}

		logger.debug(`Unable to transfer room ${room._id}: No target provided`);
		return false;
	},

	async delegateAgent(agent, inquiry) {
		const defaultAgent = await callbacks.run('livechat.beforeDelegateAgent', agent, {
			department: inquiry?.department,
		});

		if (defaultAgent) {
			logger.debug(`Delegating Inquiry ${inquiry._id} to agent ${defaultAgent.username}`);
			await LivechatInquiry.setDefaultAgentById(inquiry._id, defaultAgent);
			void notifyOnLivechatInquiryChanged(inquiry, 'updated', { defaultAgent });
		}

		logger.debug(`Queueing inquiry ${inquiry._id}`);
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

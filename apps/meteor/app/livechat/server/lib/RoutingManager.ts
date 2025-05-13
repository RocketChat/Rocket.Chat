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
		logger.debug({ msg: 'Delegating inquiry', inquiry, agent, options });

		const isAgentAvailable =
			agent?.username && (await Users.findOneOnlineAgentByUserList(agent.username)) && (await allowAgentSkipQueue(agent));
		if (!agent || !isAgentAvailable) {
			const originalAgent = agent;
			agent = await this.getNextAgent(department);
			logger.debug({
				msg: 'Invalid agent received. Obtained new agent via Routing',
				originalAgent,
				isAgentAvailable,
				inquiry: { _id: inquiry._id },
				department,
				selectedAgent: agent,
			});
		}

		if (!agent) {
			logger.debug({ msg: 'No agent available', inquiry: { _id: inquiry._id }, department });
			// When an inqury reaches here on CE, it will stay here as 'ready' since on CE there's no mechanism to re queue it.
			// When reaching this point, managers have to manually transfer the inquiry to another room. This is expected.
			return LivechatRooms.findOneById(rid);
		}

		if (!room) {
			throw new Meteor.Error('error-invalid-room');
		}

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

		logger.debug({ msg: 'Assigning agent', inquiry, agent });

		const { rid, name, v, department } = inquiry;
		if (!(await createLivechatSubscription(rid, name, v, agent, department))) {
			logger.debug({ msg: 'Agent assignment failed', inquiry, agent, reason: 'createLivechatSubscription failed' });
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

		logger.debug({ msg: 'Agent assigned', inquiry, agent });

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

		logger.debug({ msg: 'Taking inquiry', inquiry, agent, options });

		const { _id, rid } = inquiry;
		if (!room?.open) {
			logger.debug({ msg: 'Inquiry take failed', inquiry, agent, options, reason: 'room is closed' });
			return room;
		}

		if (room.servedBy && room.servedBy._id === agent.agentId) {
			logger.debug({ msg: 'Inquiry take failed', inquiry, agent, options, reason: 'already taken by the same agent' });
			return room;
		}

		try {
			await callbacks.run('livechat.checkAgentBeforeTakeInquiry', {
				agent,
				inquiry,
				options,
			});
		} catch (err) {
			if (options.clientAction && !options.forwardingToDepartment) {
				throw err;
			}
			agent = null;
			logger.debug({ msg: 'Inquiry take failed', reason: 'precondition failed for agent', err });
		}

		if (!agent) {
			return callbacks.run<'livechat.onAgentAssignmentFailed'>('livechat.onAgentAssignmentFailed', room, {
				inquiry,
				options,
			});
		}

		// TODO: taking the inquiry and assigning the agent should be a transaction
		await LivechatInquiry.takeInquiry(_id);

		logger.info({ msg: 'Inquiry taken', inquiry, agent });

		// assignAgent changes the room data to add the agent serving the conversation. afterTakeInquiry expects room object to be updated
		// TODO: assignAgent to return updated room to avoid finding it again here
		const { inquiry: returnedInquiry, user } = await this.assignAgent(inquiry as InquiryWithAgentInfo, agent);
		const roomAfterUpdate = await LivechatRooms.findOneById(rid);

		if (!roomAfterUpdate) {
			// This should never happen
			throw new Error('error-room-not-found');
		}

		void Apps.self?.getBridges()?.getListenerBridge().livechatEvent(AppEvents.IPostLivechatAgentAssigned, { room: roomAfterUpdate, user });
		void afterTakeInquiry({ inquiry: returnedInquiry, room: roomAfterUpdate, agent });

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
		const defaultAgent = await beforeDelegateAgent(agent, {
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

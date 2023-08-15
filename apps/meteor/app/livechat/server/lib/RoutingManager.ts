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
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatInquiry, LivechatRooms, Subscriptions, Rooms, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { Apps, AppEvents } from '../../../../ee/server/apps';
import { callbacks } from '../../../../lib/callbacks';
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

const logger = new Logger('RoutingManager');

type Routing = {
	methodName: string | null;
	methods: Record<string, IRoutingMethod>;
	startQueue(): void;
	isMethodSet(): boolean;
	setMethodNameAndStartQueue(name: string): void;
	registerMethod(name: string, Method: IRoutingMethodConstructor): void;
	getMethod(): IRoutingMethod;
	getConfig(): RoutingMethodConfig | undefined;
	getNextAgent(department?: string, ignoreAgentId?: string): Promise<SelectedAgent | null | undefined>;
	delegateInquiry(
		inquiry: InquiryWithAgentInfo,
		agent?: SelectedAgent | null,
		options?: { clientAction?: boolean; forwardingToDepartment?: { oldDepartmentId: string; transferData: any } },
	): Promise<IOmnichannelRoom | null | void>;
	assignAgent(inquiry: InquiryWithAgentInfo, agent: SelectedAgent): Promise<InquiryWithAgentInfo>;
	unassignAgent(inquiry: ILivechatInquiryRecord, departmentId?: string): Promise<boolean>;
	takeInquiry(
		inquiry: Omit<
			ILivechatInquiryRecord,
			'estimatedInactivityCloseTimeAt' | 'message' | 't' | 'source' | 'estimatedWaitingTimeQueue' | 'priorityWeight' | '_updatedAt'
		>,
		agent: SelectedAgent | null,
		options?: { clientAction?: boolean; forwardingToDepartment?: { oldDepartmentId: string; transferData: any } },
	): Promise<IOmnichannelRoom | null | void>;
	transferRoom(
		room: IOmnichannelRoom,
		guest: ILivechatVisitor,
		transferData: {
			departmentId?: string;
			userId?: string;
			transferredBy: { _id: string };
		},
	): Promise<boolean>;
	delegateAgent(agent: SelectedAgent, inquiry: ILivechatInquiryRecord): Promise<SelectedAgent | null | undefined>;
	removeAllRoomSubscriptions(room: Pick<IOmnichannelRoom, '_id'>, ignoreUser?: { _id: string }): Promise<void>;
};

export const RoutingManager: Routing = {
	methodName: null,
	methods: {},

	startQueue() {
		// todo: move to eventemitter or middleware
		// queue shouldn't start on CE
	},

	isMethodSet() {
		return !!this.methodName;
	},

	setMethodNameAndStartQueue(name) {
		logger.debug(`Changing default routing method from ${this.methodName} to ${name}`);
		if (!this.methods[name]) {
			logger.warn(`Cannot change routing method to ${name}. Selected Routing method does not exists. Defaulting to Manual_Selection`);
			this.methodName = 'Manual_Selection';
		} else {
			this.methodName = name;
		}

		this.startQueue();
	},

	// eslint-disable-next-line @typescript-eslint/naming-convention
	registerMethod(name, Method) {
		logger.debug(`Registering new routing method with name ${name}`);
		this.methods[name] = new Method();
	},

	getMethod() {
		if (!this.methodName) {
			throw new Meteor.Error('error-routing-method-not-set');
		}
		if (!this.methods[this.methodName]) {
			throw new Meteor.Error('error-routing-method-not-available');
		}
		return this.methods[this.methodName];
	},

	getConfig() {
		return this.getMethod().config;
	},

	async getNextAgent(department, ignoreAgentId) {
		logger.debug(`Getting next available agent with method ${this.methodName}`);
		return this.getMethod().getNextAgent(department, ignoreAgentId);
	},

	async delegateInquiry(inquiry, agent, options = {}) {
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

		logger.debug(`Inquiry ${inquiry._id} will be taken by agent ${agent.agentId}`);
		return this.takeInquiry(inquiry, agent, options);
	},

	async assignAgent(inquiry, agent) {
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
		const room = await LivechatRooms.findOneById(rid);

		if (user) {
			await Promise.all([Message.saveSystemMessage('command', rid, 'connected', user), Message.saveSystemMessage('uj', rid, '', user)]);
		}

		await dispatchAgentDelegated(rid, agent.agentId);
		logger.debug(`Agent ${agent.agentId} assigned to inquriy ${inquiry._id}. Instances notified`);

		void Apps.getBridges()?.getListenerBridge().livechatEvent(AppEvents.IPostLivechatAgentAssigned, { room, user });
		return inquiry;
	},

	async unassignAgent(inquiry, departmentId) {
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

		if (servedBy) {
			logger.debug(`Unassigning current agent for inquiry ${inquiry._id}`);
			await LivechatRooms.removeAgentByRoomId(rid);
			await this.removeAllRoomSubscriptions(room);
			await dispatchAgentDelegated(rid, null);
		}

		await dispatchInquiryQueued(inquiry);
		return true;
	},

	async takeInquiry(inquiry, agent, options = { clientAction: false }) {
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
		const room = await LivechatRooms.findOneById(rid);
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
			const cbRoom = await callbacks.run<'livechat.onAgentAssignmentFailed'>('livechat.onAgentAssignmentFailed', {
				inquiry,
				room,
				options,
			});
			return cbRoom;
		}

		await LivechatInquiry.takeInquiry(_id);
		const inq = await this.assignAgent(inquiry as InquiryWithAgentInfo, agent);
		logger.debug(`Inquiry ${inquiry._id} taken by agent ${agent.agentId}`);

		callbacks.runAsync('livechat.afterTakeInquiry', inq, agent);

		return LivechatRooms.findOneById(rid);
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
		logger.debug(`Delegating Inquiry ${inquiry._id}`);
		const defaultAgent = await callbacks.run('livechat.beforeDelegateAgent', agent, {
			department: inquiry?.department,
		});

		if (defaultAgent) {
			logger.debug(`Delegating Inquiry ${inquiry._id} to agent ${defaultAgent.username}`);
			await LivechatInquiry.setDefaultAgentById(inquiry._id, defaultAgent);
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
			// @ts-expect-error - File still in JS, expecting error for now on `u` types
			void removeAgentFromSubscription(roomId, u);
		});
	},
};

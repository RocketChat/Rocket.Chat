import { AppInterface } from '@rocket.chat/apps-engine/server/compiler';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { settings } from '../../../settings/server';
import { createLivechatSubscription,
	dispatchAgentDelegated,
	forwardRoomToAgent,
	forwardRoomToDepartment,
	removeAgentFromSubscription,
	updateChatDepartment,
} from './Helper';
import { callbacks } from '../../../callbacks/server';
import { LivechatRooms, Rooms, Messages, Users, LivechatInquiry } from '../../../models/server';
import { Apps } from '../../../apps/server';

export const RoutingManager = {
	methodName: null,
	methods: {},

	setMethodName(name) {
		this.methodName = name;
	},

	registerMethod(name, Method) {
		this.methods[name] = new Method();
	},

	getMethod() {
		if (!this.methods[this.methodName]) {
			throw new Meteor.Error('error-routing-method-not-available');
		}
		return this.methods[this.methodName];
	},

	getConfig() {
		return this.getMethod().config || {};
	},

	async getNextAgent(department) {
		let agent = callbacks.run('livechat.beforeGetNextAgent', department);

		if (!agent) {
			agent = await this.getMethod().getNextAgent(department);
		}

		return agent;
	},

	async delegateInquiry(inquiry, agent) {
		// return Room Object
		const { department, rid } = inquiry;
		if (!agent || (agent.username && !Users.findOneOnlineAgentByUsername(agent.username))) {
			agent = await this.getNextAgent(department);
		}

		if (!agent) {
			return LivechatRooms.findOneById(rid);
		}

		return this.takeInquiry(inquiry, agent);
	},

	assignAgent(inquiry, agent) {
		check(agent, Match.ObjectIncluding({
			agentId: String,
			username: String,
		}));

		const { rid, name, v } = inquiry;
		if (!createLivechatSubscription(rid, name, v, agent)) {
			throw new Meteor.Error('error-creating-subscription', 'Error creating subscription');
		}

		LivechatRooms.changeAgentByRoomId(rid, agent);
		Rooms.incUsersCountById(rid);

		const user = Users.findOneById(agent.agentId);
		const room = LivechatRooms.findOneById(rid);

		Messages.createCommandWithRoomIdAndUser('connected', rid, user);
		dispatchAgentDelegated(rid, agent.agentId);

		Apps.getBridges().getListenerBridge().livechatEvent(AppInterface.IPostLivechatAgentAssigned, { room, user });
		return inquiry;
	},

	unassignAgent(inquiry, departmentId) {
		const { _id, rid, department } = inquiry;
		const room = LivechatRooms.findOneById(rid);

		if (!room || !room.open) {
			return false;
		}

		if (departmentId && departmentId !== department) {
			updateChatDepartment({
				rid,
				newDepartmentId: departmentId,
				oldDepartmentId: department,
			});
			// Fake the department to delegate the inquiry;
			inquiry.department = departmentId;
		}

		const { servedBy } = room;

		if (servedBy) {
			removeAgentFromSubscription(rid, servedBy);
			LivechatRooms.removeAgentByRoomId(rid);
			dispatchAgentDelegated(rid, null);
		}

		LivechatInquiry.queueInquiry(_id);
		this.getMethod().delegateAgent(null, inquiry);
		return true;
	},

	async takeInquiry(inquiry, agent) {
		check(agent, Match.ObjectIncluding({
			agentId: String,
			username: String,
		}));

		check(inquiry, Match.ObjectIncluding({
			_id: String,
			rid: String,
			status: String,
		}));

		const { _id, rid } = inquiry;
		const room = LivechatRooms.findOneById(rid);
		if (!room || !room.open) {
			return room;
		}

		if (room.servedBy && room.servedBy._id === agent.agentId) {
			return room;
		}

		agent = await callbacks.run('livechat.checkAgentBeforeTakeInquiry', agent, inquiry);
		if (!agent) {
			return null;
		}

		LivechatInquiry.takeInquiry(_id);
		const inq = this.assignAgent(inquiry, agent);

		callbacks.run('livechat.afterTakeInquiry', inq);

		return LivechatRooms.findOneById(rid);
	},

	async transferRoom(room, guest, transferData) {
		if (transferData.userId) {
			return forwardRoomToAgent(room, transferData);
		}

		if (transferData.departmentId) {
			return forwardRoomToDepartment(room, guest, transferData);
		}

		return false;
	},
};

settings.get('Livechat_Routing_Method', function(key, value) {
	RoutingManager.setMethodName(value);
});

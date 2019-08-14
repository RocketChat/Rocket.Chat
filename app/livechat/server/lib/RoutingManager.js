import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { settings } from '../../../settings';
import { createLivechatSubscription, dispatchAgentDelegated, forwardRoomToAgent, forwardRoomToDepartment } from './Helper';
import { callbacks } from '../../../callbacks';
import { Rooms, Messages, Subscriptions, Users } from '../../../models';
import { LivechatInquiry } from '../../lib/LivechatInquiry';

export const RoutingManager = {
	methodName: null,
	methods: {},

	setMethodName(name) {
		this.methodName = name;
	},

	registerMethod(name, method) {
		this.methods[name] = method;
	},

	getMethod() {
		if (!this.methods[this.methodName]) {
			throw new Meteor.Error('error-routing-method-not-available');
		}
		return new this.methods[this.methodName]();
	},

	getConfig() {
		return this.getMethod().config || {};
	},

	async delegateInquiry(inquiry, agent) {
		// return Room Object
		const { department, rid } = inquiry;
		if (!agent || (agent.username && !Users.findOneOnlineAgentByUsername(agent.username))) {
			agent = await this.getMethod().getNextAgent(department);
		}

		if (!agent) {
			return Rooms.findOneById(rid);
		}

		const room = this.takeInquiry(inquiry, agent);
		return room;
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

		Rooms.changeAgentByRoomId(rid, agent);
		Rooms.incUsersCountById(rid);

		const user = Users.findOneById(agent.agentId);
		Messages.createCommandWithRoomIdAndUser('connected', rid, user);
		dispatchAgentDelegated(rid, agent.agentId);
		return inquiry;
	},

	unassignAgent(inquiry, departmentId) {
		const { _id, rid, department } = inquiry;
		const room = Rooms.findOneById(rid);
		const { servedBy } = room;

		if (!servedBy) {
			return false;
		}

		Subscriptions.removeByRoomId(rid);
		Rooms.removeAgentByRoomId(rid);
		LivechatInquiry.queueInquiry(_id);

		if (departmentId && departmentId !== department) {
			Rooms.changeDepartmentIdByRoomId(rid, departmentId);
			LivechatInquiry.changeDepartmentIdByRoomId(rid, departmentId);
		}

		this.getMethod().delegateAgent(null, inquiry);
		Messages.createUserLeaveWithRoomIdAndUser(rid, { _id: servedBy._id, username: servedBy.username });
		dispatchAgentDelegated(rid, null);

		return true;
	},

	async takeInquiry(inquiry, agent) {
		// return Room Object
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
		const room = Rooms.findOneById(rid);
		if (room && room.servedBy && room.servedBy._id === agent.agentId) {
			return room;
		}

		agent = await callbacks.run('livechat.checkAgentBeforeTakeInquiry', agent, inquiry);
		if (!agent) {
			return room;
		}

		LivechatInquiry.takeInquiry(_id);
		const inq = this.assignAgent(inquiry, agent);

		callbacks.run('livechat.afterTakeInquiry', inq);

		return Rooms.findOneById(rid);
	},

	async transferRoom(room, guest, transferData) {
		const { userId, departmentId } = transferData;

		if (userId) {
			return forwardRoomToAgent(room, userId);
		}

		if (departmentId) {
			return forwardRoomToDepartment(room, guest, departmentId);
		}

		return false;
	},
};

settings.get('Livechat_Routing_Method', function(key, value) {
	RoutingManager.setMethodName(value);
});

import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { settings } from '../../../settings';
import { createLivechatSubscription, dispatchAgentDelegated } from './Helper';
import { Livechat } from './Livechat';
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
		if (!agent) {
			agent = this.getMethod().delegateAgent(agent, inquiry);
		}

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

		const { _id, rid, status } = inquiry;
		const room = Rooms.findOneById(rid);

		if (status !== 'queued') {
			return room;
		}

		agent = await callbacks.run('livechat.checkAgentBeforeTakeInquiry', agent, inquiry);
		if (!agent) {
			return room;
		}

		LivechatInquiry.takeInquiry(_id);
		inquiry = this.assignAgent(inquiry, agent);

		callbacks.run('livechat.afterTakeInquiry', inquiry);

		return Rooms.findOneById(rid);
	},

	transferRoom(room, guest, transferData) {
		const { userId, departmentId } = transferData;
		const { _id: rid, servedBy } = room;
		let agent;

		if (userId) {
			const user = Users.findOneOnlineAgentById(userId);
			if (!user) {
				return false;
			}

			const { _id: agentId, username } = user;
			agent = Object.assign({}, { agentId, username });
		} else {
			agent = this.getMethod().getNextAgent(departmentId);
		}

		if (!agent) {
			return Livechat.returnRoomAsInquiry(rid, departmentId);
		}

		if (departmentId) {
			Rooms.changeDepartmentIdByRoomId(rid, departmentId);
		}

		if (agent && servedBy && agent.agentId !== servedBy._id) {
			Subscriptions.removeByRoomIdAndUserId(rid, servedBy._id);
			Messages.createUserLeaveWithRoomIdAndUser(rid, { _id: servedBy._id, username: servedBy.username });

			const inquiry = LivechatInquiry.findOneByRoomId(rid);
			if (!inquiry) {
				throw new Meteor.Error('error-transfer-inquiry');
			}

			this.assignAgent(inquiry, agent);

			Messages.createUserJoinWithRoomIdAndUser(rid, { _id: agent.agentId, username: agent.username });

			const guestData = {
				token: guest.token,
				department: transferData.departmentId,
			};

			Livechat.setDepartmentForGuest(guestData);

			return true;
		}

		return false;
	},
};

settings.get('Livechat_Routing_Method', function(key, value) {
	RoutingManager.setMethodName(value);
});

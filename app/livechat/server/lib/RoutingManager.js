import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { settings } from '../../../settings';
import { createLivechatSubscription } from './Helper';
import { Livechat } from './Livechat';
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

	delegate(inquiry, agent) {
		// return Room Object
		return this.getMethod().delegateInquiry(inquiry, agent);
	},

	assignAgent(inquiry, agent) {
		check(agent, Match.ObjectIncluding({
			agentId: String,
			username: String,
		}));

		const { _id, rid, name, v } = inquiry;
		if (!createLivechatSubscription(rid, name, v, agent)) {
			throw new Meteor.Error('error-creating-subscription', 'Error creating subscription');
		}

		LivechatInquiry.takeInquiry(_id);
		Rooms.changeAgentByRoomId(rid, agent);
		Rooms.incUsersCountById(rid);

		const user = Users.findOneById(agent.agentId);
		Messages.createCommandWithRoomIdAndUser('connected', rid, user);

		Livechat.stream.emit(rid, {
			type: 'agentData',
			data: Users.getAgentInfo(agent.agentId),
		});
	},

	transfer(room, guest, transferData) {
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

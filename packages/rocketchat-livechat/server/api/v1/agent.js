import { findRoom, findAgent } from '../lib/livechat';

RocketChat.API.v1.addRoute('livechat/agent.info/:rid/:token', {
	get() {
		try {
			check(this.urlParams, {
				rid: String,
				token: String,
			});

			const room = findRoom(this.urlParams.token, this.urlParams.rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const agent = room && room.servedBy && findAgent(room.servedBy._id);
			if (!agent) {
				throw new Meteor.Error('invalid-agent');
			}

			return RocketChat.API.v1.success({ agent });
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});

RocketChat.API.v1.addRoute('livechat/agent.next/:token', {
	get() {
		try {
			check(this.urlParams, {
				token: String,
			});

			check(this.queryParams, {
				department: Match.Maybe(String),
			});

			const room = findRoom(this.urlParams.token);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			let { department } = this.queryParams;
			if (!department) {
				const requireDeparment = RocketChat.Livechat.getRequiredDepartment();
				if (requireDeparment) {
					department = requireDeparment._id;
				}
			}

			const agentData = RocketChat.Livechat.getNextAgent(department);
			if (!agentData) {
				throw new Meteor.Error('agent-not-found');
			}

			const agent = findAgent(agentData.agentId);
			if (!agent) {
				throw new Meteor.Error('invalid-agent');
			}

			return RocketChat.API.v1.success({ agent });
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});

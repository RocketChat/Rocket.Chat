import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:getNextAgent'({ token, department }) {
		check(token, String);

		const room = RocketChat.models.Rooms.findOpenByVisitorToken(token).fetch();

		if (room && room.length > 0) {
			return;
		}

		if (!department) {
			const requireDeparment = Livechat.getRequiredDepartment();
			if (requireDeparment) {
				department = requireDeparment._id;
			}
		}

		const agent = Livechat.getNextAgent(department);
		if (!agent) {
			return;
		}

		return RocketChat.models.Users.getAgentInfo(agent.agentId);
	},
});

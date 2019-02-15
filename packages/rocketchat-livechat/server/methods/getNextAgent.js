import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Rooms, Users } from 'meteor/rocketchat:models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:getNextAgent'({ token, department }) {
		check(token, String);

		const room = Rooms.findOpenByVisitorToken(token).fetch();

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

		return Users.getAgentInfo(agent.agentId);
	},
});

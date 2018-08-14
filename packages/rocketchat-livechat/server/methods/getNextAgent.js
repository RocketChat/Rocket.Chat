Meteor.methods({
	'livechat:getNextAgent'({ token, department }) {
		check(token, String);

		const room = RocketChat.models.Rooms.findOpenByVisitorToken(token).fetch();

		if (room && room.length > 0) {
			return;
		}

		if (!department) {
			const requireDeparment = RocketChat.Livechat.getRequiredDepartment();
			if (requireDeparment) {
				department = requireDeparment._id;
			}
		}

		const agent = RocketChat.Livechat.getNextAgent(department);
		if (!agent) {
			return;
		}

		return RocketChat.models.Users.getAgentInfo(agent.agentId);
	}
});

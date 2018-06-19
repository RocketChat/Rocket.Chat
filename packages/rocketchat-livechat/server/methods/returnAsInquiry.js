Meteor.methods({
	'livechat:returnAsInquiry'(rid, departmentId) {
		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:returnAsInquiry' });
		}

		//When an user goes offline, for example, their user is no longer available
		//In this case, an error is raised, so to avoid this the room user is instantiated
		let user = Meteor.user();
		if (!user) {
			user = RocketChat.models.Users.findOne(room.servedBy._id);
		}

		if (!(user && user._id && RocketChat.authz.hasPermission(user._id, 'view-l-room'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:returnAsInquiry' });
		}

		const agentIds = [];
		//get the agents of the department
		if (departmentId) {
			let agents = RocketChat.Livechat.getOnlineAgents(departmentId);

			if (agents.count() === 0 && RocketChat.settings.get('Livechat_guest_pool_with_no_agents')) {
				agents = RocketChat.Livechat.getAgents(departmentId);
			}

			if (agents.count() === 0) {
				return false;
			}

			agents.forEach((agent) => {
				agentIds.push(agent.agentId);
			});
		}

		//delete agent and room subscription
		RocketChat.models.Subscriptions.removeByRoomId(rid);

		// remove user from room
		const username = user.username;

		RocketChat.models.Rooms.removeUsernameById(rid, username);

		// find inquiry corresponding to room
		const inquiry = RocketChat.models.LivechatInquiry.findOne({rid});

		// mark inquiry as open
		if (agentIds.length === 0) {
			return RocketChat.models.LivechatInquiry.openInquiry(inquiry._id);
		} else {
			return RocketChat.models.LivechatInquiry.openInquiryWithAgents(inquiry._id, agentIds);
		}
	}
});

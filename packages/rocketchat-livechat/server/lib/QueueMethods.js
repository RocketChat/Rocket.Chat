RocketChat.QueueMethods = {
	/* Least Amount Queuing method:
	 *
	 * default method where the agent with the least number
	 * of open chats is paired with the incoming livechat
	 */
	'Least_Amount'(guest, message, room, agent) {
		if (!agent) {
			agent = RocketChat.Livechat.getNextAgent(guest.department);
			if (!agent) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}
		}

		RocketChat.models.Rooms.changeAgentByRoomId(room._id, agent);
		RocketChat.models.Subscriptions.subscribeWithRoomAndUser(room, agent);

		RocketChat.Livechat.stream.emit(room._id, {
			type: 'agentData',
			data: RocketChat.models.Users.getAgentInfo(agent.agentId)
		});

		return agent;
	},
	/* Guest Pool Queuing Method:
	 *
	 * An incomming livechat is created as an Inquiry
	 * which is picked up from an agent.
	 * An Inquiry is visible to all agents (TODO: in the correct department)
	 *
	 */
	'Guest_Pool'(guest, message) {
		let agents = RocketChat.Livechat.getOnlineAgents(guest.department);

		if (agents.count() === 0 && RocketChat.settings.get('Livechat_guest_pool_with_no_agents')) {
			agents = RocketChat.Livechat.getAgents(guest.department);
		}

		if (agents.count() === 0) {
			throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
		}

		const agentIds = [];

		agents.forEach((agent) => {
			if (guest.department) {
				agentIds.push(agent.agentId);
			} else {
				agentIds.push(agent._id);
			}
		});

		const inquiry = {
			rid: message.rid,
			message: message.msg,
			name: guest.name || guest.username,
			ts: new Date(),
			department: guest.department,
			agents: agentIds,
			status: 'open',
			v: {
				_id: guest._id,
				username: guest.username,
				token: message.token,
				status: guest.status || 'online'
			},
			t: 'l'
		};
		RocketChat.models.LivechatInquiry.insert(inquiry);

		return undefined;
	},
	'External'(guest, message, room, agent) {
		return this['Least_Amount'](guest, message, room, agent); // eslint-disable-line
	}
};

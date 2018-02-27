import _ from 'underscore';

RocketChat.QueueMethods = {
	/* Least Amount Queuing method:
	 *
	 * default method where the agent with the least number
	 * of open chats is paired with the incoming livechat
	 */
	'Least_Amount'(guest, message, roomInfo, agent) {
		if (!agent) {
			agent = RocketChat.Livechat.getNextAgent(guest.department);
			if (!agent) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}
		}

		const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();

		const room = _.extend({
			_id: message.rid,
			msgs: 1,
			lm: new Date(),
			code: roomCode,
			label: guest.name || guest.username,
			name: (roomInfo && roomInfo.name) || guest.name || guest.username,
			fname: (roomInfo && roomInfo.fname) || guest.name || guest.username,
			// usernames: [agent.username, guest.username],
			t: 'l',
			ts: new Date(),
			v: {
				_id: guest._id,
				username: guest.username,
				token: message.token,
				status: guest.status || 'online'
			},
			servedBy: {
				_id: agent.agentId,
				username: agent.username
			},
			cl: false,
			open: true,
			waitingResponse: true
		}, roomInfo);
		const subscriptionData = {
			rid: message.rid,
			name: guest.name || guest.username,
			alert: true,
			open: true,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
			code: roomCode,
			u: {
				_id: agent.agentId,
				username: agent.username
			},
			t: 'l',
			desktopNotifications: 'all',
			mobilePushNotifications: 'all',
			emailNotifications: 'all'
		};

		RocketChat.models.Rooms.insert(room);
		RocketChat.models.Subscriptions.insert(subscriptionData);

		RocketChat.Livechat.stream.emit(room._id, {
			type: 'agentData',
			data: RocketChat.models.Users.getAgentInfo(agent.agentId)
		});

		return room;
	},
	/* Guest Pool Queuing Method:
	 *
	 * An incomming livechat is created as an Inquiry
	 * which is picked up from an agent.
	 * An Inquiry is visible to all agents (TODO: in the correct department)
     *
	 * A room is still created with the initial message, but it is occupied by
	 * only the client until paired with an agent
	 */
	'Guest_Pool'(guest, message, roomInfo) {
		let agents = RocketChat.Livechat.getOnlineAgents(guest.department);

		if (agents.count() === 0 && RocketChat.settings.get('Livechat_guest_pool_with_no_agents')) {
			agents = RocketChat.Livechat.getAgents(guest.department);
		}

		if (agents.count() === 0) {
			throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
		}

		const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();

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
			code: roomCode,
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
		const room = _.extend({
			_id: message.rid,
			msgs: 1,
			lm: new Date(),
			code: roomCode,
			label: guest.name || guest.username,
			fname: guest.name || guest.username,
			// usernames: [guest.username],
			t: 'l',
			ts: new Date(),
			v: {
				_id: guest._id,
				username: guest.username,
				token: message.token,
				status: guest.status
			},
			cl: false,
			open: true,
			waitingResponse: true
		}, roomInfo);
		RocketChat.models.LivechatInquiry.insert(inquiry);
		RocketChat.models.Rooms.insert(room);

		return room;
	},
	'External'(guest, message, roomInfo, agent) {
		return this['Least_Amount'](guest, message, roomInfo, agent); // eslint-disable-line
	}
};

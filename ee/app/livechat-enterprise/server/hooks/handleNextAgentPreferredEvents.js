import { callbacks } from '../../../../../app/callbacks/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';
import { LivechatRooms, LivechatInquiry, LivechatVisitors, Users } from '../../../../../app/models/server';

let contactManagerPreferred = false;
let lastChattedAgentPreferred = false;

const normalizeDefaultAgent = (agent) => {
	if (!agent) {
		return;
	}

	const { _id: agentId, username } = agent;
	return { agentId, username };
};

const getDefaultAgent = (username) => username && normalizeDefaultAgent(Users.findOneOnlineAgentByUserList(username, { fields: { _id: 1, username: 1 } }));

const checkDefaultAgentOnNewRoom = (defaultAgent, defaultGuest) => {
	if (defaultAgent || !defaultGuest) {
		return defaultAgent;
	}

	const { _id: guestId } = defaultGuest;
	const guest = LivechatVisitors.findOneById(guestId, { fields: { lastAgent: 1, token: 1, contactManager: 1 } });
	if (!guest) {
		return defaultAgent;
	}

	const { lastAgent, token, contactManager } = guest;
	const guestManager = contactManagerPreferred && getDefaultAgent(contactManager?.username);
	if (guestManager) {
		return guestManager;
	}

	if (!lastChattedAgentPreferred) {
		return defaultAgent;
	}

	const guestAgent = getDefaultAgent(lastAgent?.username);
	if (guestAgent) {
		return guestAgent;
	}

	const room = LivechatRooms.findOneLastServedAndClosedByVisitorToken(token, { fields: { servedBy: 1 } });
	if (!room?.servedBy) {
		return defaultAgent;
	}

	const { servedBy: { username: usernameByRoom } } = room;
	const lastRoomAgent = normalizeDefaultAgent(Users.findOneOnlineAgentByUserList(usernameByRoom, { fields: { _id: 1, username: 1 } }));
	return lastRoomAgent || defaultAgent;
};

const onMaxNumberSimultaneousChatsReached = (inquiry) => {
	if (!inquiry || !inquiry.defaultAgent) {
		return inquiry;
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return inquiry;
	}

	const { _id } = inquiry;

	LivechatInquiry.removeDefaultAgentById(_id);
	return LivechatInquiry.findOneById(_id);
};

const afterTakeInquiry = (inquiry, agent) => {
	if (!inquiry || !agent) {
		return inquiry;
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return inquiry;
	}

	const { v: { token } = {} } = inquiry;
	if (!token) {
		return inquiry;
	}

	LivechatVisitors.updateLastAgentByToken(token, { ...agent, ts: new Date() });

	return inquiry;
};
settings.get('Livechat_last_chatted_agent_routing', function(key, value) {
	lastChattedAgentPreferred = value;
	if (!lastChattedAgentPreferred) {
		callbacks.remove('livechat.onMaxNumberSimultaneousChatsReached', 'livechat-on-max-number-simultaneous-chats-reached');
		callbacks.remove('livechat.afterTakeInquiry', 'livechat-save-default-agent-after-take-inquiry');
		return;
	}

	callbacks.add('livechat.afterTakeInquiry', afterTakeInquiry, callbacks.priority.MEDIUM, 'livechat-save-default-agent-after-take-inquiry');
	callbacks.add('livechat.onMaxNumberSimultaneousChatsReached', onMaxNumberSimultaneousChatsReached, callbacks.priority.MEDIUM, 'livechat-on-max-number-simultaneous-chats-reached');
});

settings.get('Omnichannel_contact_manager_routing', function(key, value) {
	contactManagerPreferred = value;
});


callbacks.add('livechat.checkDefaultAgentOnNewRoom', checkDefaultAgentOnNewRoom, callbacks.priority.MEDIUM, 'livechat-check-default-agent-new-room');

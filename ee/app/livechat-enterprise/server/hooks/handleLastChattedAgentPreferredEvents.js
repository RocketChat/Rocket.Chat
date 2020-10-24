import { callbacks } from '../../../../../app/callbacks/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';
import { LivechatRooms, LivechatInquiry, LivechatVisitors, Users } from '../../../../../app/models/server';

const normalizeDefaultAgent = (agent) => {
	if (!agent) {
		return;
	}

	const { _id: agentId, username } = agent;
	return { agentId, username };
};

const checkDefaultAgentOnNewRoom = (defaultAgent, defaultGuest) => {
	if (defaultAgent || !defaultGuest) {
		return defaultAgent;
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return defaultAgent;
	}

	const { _id: guestId } = defaultGuest;
	const guest = LivechatVisitors.findOneById(guestId, { fields: { lastAgent: 1, token: 1 } });
	const { lastAgent: { username: usernameByVisitor } = {}, token } = guest;

	const lastGuestAgent = usernameByVisitor && normalizeDefaultAgent(Users.findOneOnlineAgentByUsername(usernameByVisitor, { fields: { _id: 1, username: 1 } }));
	if (lastGuestAgent) {
		return lastGuestAgent;
	}

	const room = LivechatRooms.findOneLastServedAndClosedByVisitorToken(token, { fields: { servedBy: 1 } });
	if (!room || !room.servedBy) {
		return defaultAgent;
	}

	const { servedBy: { username: usernameByRoom } } = room;
	const lastRoomAgent = normalizeDefaultAgent(Users.findOneOnlineAgentByUsername(usernameByRoom, { fields: { _id: 1, username: 1 } }));
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
	if (!value) {
		callbacks.remove('livechat.checkDefaultAgentOnNewRoom', 'livechat-check-default-agent-new-room');
		callbacks.remove('livechat.onMaxNumberSimultaneousChatsReached', 'livechat-on-max-number-simultaneous-chats-reached');
		callbacks.remove('livechat.afterTakeInquiry', 'livechat-save-default-agent-after-take-inquiry');
		return;
	}

	callbacks.add('livechat.checkDefaultAgentOnNewRoom', checkDefaultAgentOnNewRoom, callbacks.priority.MEDIUM, 'livechat-check-default-agent-new-room');
	callbacks.add('livechat.onMaxNumberSimultaneousChatsReached', onMaxNumberSimultaneousChatsReached, callbacks.priority.MEDIUM, 'livechat-on-max-number-simultaneous-chats-reached');
	callbacks.add('livechat.afterTakeInquiry', afterTakeInquiry, callbacks.priority.MEDIUM, 'livechat-save-default-agent-after-take-inquiry');
});

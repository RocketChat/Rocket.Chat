import { callbacks } from '../../../../../app/callbacks';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings';
import { LivechatRooms, Users } from '../../../../../app/models/server';

callbacks.add('livechat.checkDefaultAgentOnNewRoom', (agent, guest) => {
	if (agent || !guest) {
		return agent;
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return agent;
	}

	if (!settings.get('Livechat_last_chatted_agent_routing')) {
		return agent;
	}

	const { lastAgent: { username: usernameByVisitor } = {}, token } = guest;
	const lastGuestAgent = usernameByVisitor && Users.findOneOnlineAgentByUsername(usernameByVisitor, { fields: { _id: 1, username: 1 } });
	if (lastGuestAgent) {
		return lastGuestAgent;
	}

	const room = LivechatRooms.findLastServedAndClosedByVisitorToken(token, { fields: { servedBy: 1 } });
	if (!room || !room.servedBy) {
		return agent;
	}

	const { servedBy: { username: usernameByRoom } } = room;
	const lastRoomAgent = Users.findOneOnlineAgentByUsername(usernameByRoom, { fields: { _id: 1, username: 1 } });
	return lastRoomAgent || agent;
}, callbacks.priority.MEDIUM, 'livechat-check-default-agent-new-room');

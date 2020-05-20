import { callbacks } from '../../../../../app/callbacks/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';
import { LivechatRooms, LivechatVisitors, Users } from '../../../../../app/models/server';

callbacks.add('livechat.checkDefaultAgentOnNewRoom', (defaultAgent, defaultGuest) => {
	if (defaultAgent || !defaultGuest) {
		return defaultAgent;
	}

	if (!RoutingManager.getConfig().autoAssignAgent) {
		return defaultAgent;
	}

	if (!settings.get('Livechat_last_chatted_agent_routing')) {
		return defaultAgent;
	}

	const { _id: guestId } = defaultGuest;
	const guest = LivechatVisitors.findOneById(guestId, { fields: { lastAgent: 1, token: 1 } });
	const { lastAgent: { username: usernameByVisitor } = {}, token } = guest;

	const lastGuestAgent = usernameByVisitor && Users.findOneOnlineAgentByUsername(usernameByVisitor, { fields: { _id: 1, username: 1 } });
	if (lastGuestAgent) {
		return lastGuestAgent;
	}

	const room = LivechatRooms.findOneLastServedAndClosedByVisitorToken(token, { fields: { servedBy: 1 } });
	if (!room || !room.servedBy) {
		return defaultAgent;
	}

	const { servedBy: { username: usernameByRoom } } = room;
	const lastRoomAgent = Users.findOneOnlineAgentByUsername(usernameByRoom, { fields: { _id: 1, username: 1 } });
	return lastRoomAgent || defaultAgent;
}, callbacks.priority.MEDIUM, 'livechat-check-default-agent-new-room');

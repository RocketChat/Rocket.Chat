import { RoutingManager } from '../RoutingManager';
import { Users } from '../../../../models';

/* Ongoing Chats Queuing method:
	*
	* default method where the agent with the least number
	* of open chats is paired with the incoming livechat
*/
class OngoingChats {
	constructor() {
		this.config = {
			previewRoom: false,
			showConnecting: false,
			showQueue: false,
			returnQueue: false,
			enableTriggerAction: true,
		};
	}

	async getNextAgent(department) {
		const agent = await Users.getNextLeastBusyAgent(department);
		return agent;
	}

	delegateRoom(agent) {
		return agent;
	}
}

RoutingManager.registerMethod('Ongoing_Chats', OngoingChats);

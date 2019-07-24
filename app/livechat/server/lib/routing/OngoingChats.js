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
			autoAssignAgent: true,
		};
	}

	async getNextAgent(department) {
		let agent;

		const nextAgent = await Users.getNextLeastBusyAgent(department);
		if (nextAgent) {
			const { agentId, username } = nextAgent;
			agent = Object.assign({}, { agentId, username });
		}

		return agent;
	}

	delegateAgent(agent) {
		return agent;
	}
}

RoutingManager.registerMethod('Ongoing_Chats', OngoingChats);

import { RoutingManager } from '../RoutingManager';
import { LivechatDepartmentAgents, Users } from '../../../../models/server';

/* Least Amount Queuing method:
	*
	* default method where the agent with the least number
	* of open chats is paired with the incoming livechat
*/
class LeastAmount {
	constructor() {
		this.config = {
			previewRoom: false,
			showConnecting: false,
			showQueue: false,
			showQueueLink: true,
			returnQueue: false,
			enableTriggerAction: true,
			autoAssignAgent: true,
		};
	}

	getNextAgent(department) {
		if (department) {
			return LivechatDepartmentAgents.getNextAgentForDepartment(department);
		}

		return Users.getNextAgent();
	}

	delegateAgent(agent) {
		return agent;
	}
}

RoutingManager.registerMethod('Least_Amount', LeastAmount);

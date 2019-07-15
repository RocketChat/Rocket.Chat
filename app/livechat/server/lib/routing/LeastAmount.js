import { RoutingManager } from '../RoutingManager';
import { LivechatDepartmentAgents, Rooms, Users } from '../../../../models';

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
			returnQueue: false,
			enableTriggerAction: true,
		};
	}

	getNextAgent(department) {
		if (department) {
			return LivechatDepartmentAgents.getNextAgentForDepartment(department);
		}

		return Users.getNextAgent();
	}

	delegateInquiry(inquiry, agent) {
		const { department, rid } = inquiry;

		if (!agent || (agent.username && !Users.findOneOnlineAgentByUsername(agent.username))) {
			agent = this.getNextAgent(department);
		}

		RoutingManager.assignAgent(inquiry, agent);
		return Rooms.findOneById(rid);
	}
}

RoutingManager.registerMethod('Least_Amount', LeastAmount);

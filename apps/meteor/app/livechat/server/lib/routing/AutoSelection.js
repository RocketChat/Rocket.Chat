import { RoutingManager } from '../RoutingManager';
import { LivechatDepartmentAgents, Users } from '../../../../models/server';
import { callbacks } from '../../../../../lib/callbacks';

/* Auto Selection Queuing method:
 *
 * default method where the agent with the least number
 * of open chats is paired with the incoming livechat
 */
class AutoSelection {
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

	getNextAgent(department, ignoreAgentId) {
		const extraQuery = callbacks.run('livechat.applySimultaneousChatRestrictions', undefined, {
			...(department ? { departmentId: department } : {}),
		});
		if (department) {
			return LivechatDepartmentAgents.getNextAgentForDepartment(department, ignoreAgentId, extraQuery);
		}

		return Users.getNextAgent(ignoreAgentId, extraQuery);
	}
}

RoutingManager.registerMethod('Auto_Selection', AutoSelection);

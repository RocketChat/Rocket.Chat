import { Users } from '@rocket.chat/models';

import { RoutingManager } from '../../../../../../app/livechat/server/lib/RoutingManager';
import type { IRoutingManagerConfig } from '../../../../../../definition/IRoutingManagerConfig';

/* Load Balancing Queuing method:
 *
 * default method where the agent with the least number
 * of open chats is paired with the incoming livechat
 */
class LoadBalancing {
	private _config: IRoutingManagerConfig;

	constructor() {
		this._config = {
			previewRoom: false,
			showConnecting: false,
			showQueue: false,
			showQueueLink: false,
			returnQueue: false,
			enableTriggerAction: true,
			autoAssignAgent: true,
		};
	}

	get config(): IRoutingManagerConfig {
		return this._config;
	}

	async getNextAgent(department?: string, ignoreAgentId?: string) {
		const nextAgent = await Users.getNextLeastBusyAgent(department, ignoreAgentId);
		if (!nextAgent) {
			return;
		}
		const { agentId, username } = nextAgent;
		return { agentId, username };
	}
}

RoutingManager.registerMethod('Load_Balancing', LoadBalancing);

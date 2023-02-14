import type { IOmnichannelCustomAgent } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { RoutingManager } from '../../../../../../app/livechat/server/lib/RoutingManager';
import type { IRoutingManagerConfig } from '../../../../../../definition/IRoutingManagerConfig';

/* Load Rotation Queuing method:
 * Routing method where the agent with the oldest routing time is the next agent to serve incoming chats
 */
class LoadRotation {
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

	public async getNextAgent(department?: string, ignoreAgentId?: string): Promise<IOmnichannelCustomAgent | undefined> {
		const nextAgent = await Users.getLastAvailableAgentRouted(department, ignoreAgentId);
		if (!nextAgent) {
			return;
		}

		const { agentId, username } = nextAgent;
		return { agentId, username };
	}
}

RoutingManager.registerMethod('Load_Rotation', LoadRotation);

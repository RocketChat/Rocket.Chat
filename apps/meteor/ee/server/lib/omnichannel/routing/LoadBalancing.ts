import { Users } from '@rocket.chat/models';

import type { IRoutingManagerConfig } from '../../../../../definition/IRoutingManagerConfig';
import { RoutingManager } from '../../../../../server/lib/omnichannel/RoutingManager';
import { settings } from '../../../../../server/settings';
import { getChatLimitsQuery } from '../../../hooks/omnichannel/applySimultaneousChatsRestrictions';
import { logger } from '../logger';

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
		const enabledWhenIdle = settings.get<boolean>('Livechat_enabled_when_agent_idle');
		const enabledWhenOffline = settings.get<boolean>('Livechat_accept_chats_with_no_agents');

		const extraQuery = await getChatLimitsQuery(department);
		const unavailableUsers = await Users.getUnavailableAgents(department, extraQuery, enabledWhenIdle, enabledWhenOffline);
		logger.debug({ msg: 'Ignoring unavailable agents from assignment', unavailableUsers, department, enabledWhenIdle, enabledWhenOffline });

		const nextAgent = await Users.getNextLeastBusyAgent(
			department,
			ignoreAgentId,
			enabledWhenIdle,
			unavailableUsers.map((u) => u.username),
			enabledWhenOffline,
		);
		if (!nextAgent) {
			return;
		}
		const { agentId, username } = nextAgent;
		return { agentId, username };
	}
}

RoutingManager.registerMethod('Load_Balancing', LoadBalancing);

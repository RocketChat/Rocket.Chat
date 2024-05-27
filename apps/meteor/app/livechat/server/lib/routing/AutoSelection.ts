import type { IRoutingMethod, RoutingMethodConfig, SelectedAgent } from '@rocket.chat/core-typings';
import { LivechatDepartmentAgents, Users } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChanged } from '../../../../lib/server/lib/notifyListener';
import { settings } from '../../../../settings/server';
import { RoutingManager } from '../RoutingManager';

/* Auto Selection Queuing method:
 *
 * default method where the agent with the least number
 * of open chats is paired with the incoming livechat
 */
class AutoSelection implements IRoutingMethod {
	config: RoutingMethodConfig;

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

	async getNextAgent(department?: string, ignoreAgentId?: string): Promise<SelectedAgent | null | undefined> {
		const extraQuery = await callbacks.run('livechat.applySimultaneousChatRestrictions', undefined, {
			...(department ? { departmentId: department } : {}),
		});
		if (department) {
			const departmentAgent = await LivechatDepartmentAgents.getNextAgentForDepartment(
				department,
				settings.get<boolean>('Livechat_enabled_when_agent_idle'),
				ignoreAgentId,
				extraQuery,
			);

			if (departmentAgent) {
				void notifyOnLivechatDepartmentAgentChanged(departmentAgent);
			}

			return departmentAgent;
		}

		return Users.getNextAgent(ignoreAgentId, extraQuery);
	}
}

RoutingManager.registerMethod('Auto_Selection', AutoSelection);

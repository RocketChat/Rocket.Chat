import type { IRoutingMethod, RoutingMethodConfig, SelectedAgent } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../../../../server/lib/logger/system';
import { settings } from '../../../../settings/server';
import { RoutingManager } from '../RoutingManager';

class ExternalQueue implements IRoutingMethod {
	config: RoutingMethodConfig;

	constructor() {
		this.config = {
			previewRoom: false,
			showConnecting: false,
			showQueue: false,
			showQueueLink: false,
			returnQueue: false,
			enableTriggerAction: true,
			autoAssignAgent: true,
		};
	}

	async getNextAgent(department?: string, ignoreAgentId?: string): Promise<SelectedAgent | null | undefined> {
		const promises = [];
		for (let i = 0; i < 10; i++) {
			promises.push(this.getAgentFromExternalQueue(department, ignoreAgentId));
		}
		try {
			const results = (await Promise.all(promises)).filter(Boolean);
			if (!results.length) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}
			return results[0];
		} catch (err) {
			SystemLogger.error({ msg: 'Error requesting agent from external queue.', err });
			throw err;
		}
	}

	private async getAgentFromExternalQueue(department?: string, ignoreAgentId?: string): Promise<SelectedAgent | null | undefined> {
		try {
			const request = await fetch(`${settings.get('Livechat_External_Queue_URL')}`, {
				headers: {
					'User-Agent': 'RocketChat Server',
					'Accept': 'application/json',
					'X-RocketChat-Secret-Token': settings.get('Livechat_External_Queue_Token'),
				},
				params: {
					...(department && { departmentId: department }),
					...(ignoreAgentId && { ignoreAgentId }),
				},
			});
			const result = (await request.json()) as { username?: string };

			if (result?.username) {
				const agent = await Users.findOneOnlineAgentByUserList(result.username);

				if (!agent?.username) {
					return;
				}
				return {
					agentId: agent._id,
					username: agent.username,
				};
			}
		} catch (err) {
			SystemLogger.error({ msg: 'Error requesting agent from external queue.', err });
		}
	}
}

RoutingManager.registerMethod('External', ExternalQueue);

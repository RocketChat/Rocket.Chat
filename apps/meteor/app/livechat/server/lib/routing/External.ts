import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import type { IRoutingMethod, RoutingMethodConfig, SelectedAgent } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../../settings/server';
import { RoutingManager } from '../RoutingManager';
import { SystemLogger } from '../../../../../server/lib/logger/system';

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
			let queryString = department ? `?departmentId=${department}` : '';
			if (ignoreAgentId) {
				const ignoreAgentIdParam = `ignoreAgentId=${ignoreAgentId}`;
				queryString = queryString.startsWith('?') ? `${queryString}&${ignoreAgentIdParam}` : `?${ignoreAgentIdParam}`;
			}
			const result = HTTP.call('GET', `${settings.get('Livechat_External_Queue_URL')}${queryString}`, {
				headers: {
					'User-Agent': 'RocketChat Server',
					'Accept': 'application/json',
					'X-RocketChat-Secret-Token': settings.get('Livechat_External_Queue_Token'),
				},
			});

			if (result?.data?.username) {
				const agent = await Users.findOneOnlineAgentByUserList(result.data.username);

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

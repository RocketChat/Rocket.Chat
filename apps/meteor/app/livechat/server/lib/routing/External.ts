import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import type { IRoutingMethod, RoutingMethodConfig, SelectedAgent } from '@rocket.chat/core-typings';

import { settings } from '../../../../settings/server';
import { RoutingManager } from '../RoutingManager';
import { Users } from '../../../../models/server';
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

	getNextAgent(department?: string, ignoreAgentId?: string): Promise<SelectedAgent | null | undefined> {
		for (let i = 0; i < 10; i++) {
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
					const agent = Users.findOneOnlineAgentByUserList(result.data.username);

					if (agent) {
						return Promise.resolve({
							agentId: agent._id,
							username: agent.username,
						});
					}
				}
			} catch (err) {
				SystemLogger.error({ msg: 'Error requesting agent from external queue.', err });
				break;
			}
		}
		throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
	}
}

RoutingManager.registerMethod('External', ExternalQueue);

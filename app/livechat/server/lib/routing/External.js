import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../../../settings/server';
import { RoutingManager } from '../RoutingManager';
import { Users } from '../../../../models/server';

class ExternalQueue {
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

	getNextAgent(department) {
		for (let i = 0; i < 10; i++) {
			try {
				const queryString = department ? `?departmentId=${ department }` : '';
				const result = HTTP.call('GET', `${ settings.get('Livechat_External_Queue_URL') }${ queryString }`, {
					headers: {
						'User-Agent': 'RocketChat Server',
						Accept: 'application/json',
						'X-RocketChat-Secret-Token': settings.get('Livechat_External_Queue_Token'),
					},
				});

				if (result && result.data && result.data.username) {
					const agent = Users.findOneOnlineAgentByUsername(result.data.username);

					if (agent) {
						return {
							agentId: agent._id,
							username: agent.username,
						};
					}
				}
			} catch (e) {
				console.error('Error requesting agent from external queue.', e);
				break;
			}
		}
		throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
	}

	delegateAgent(agent) {
		return agent;
	}
}

RoutingManager.registerMethod('External', ExternalQueue);

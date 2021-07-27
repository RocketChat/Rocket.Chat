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

	getNextAgent(department, ignoreAgentId) {
		for (let i = 0; i < 10; i++) {
			try {
				let queryString = department ? `?departmentId=${ department }` : '';
				if (ignoreAgentId) {
					const ignoreAgentIdParam = `ignoreAgentId=${ ignoreAgentId }`;
					queryString = queryString.startsWith('?') ? `${ queryString }&${ ignoreAgentIdParam }` : `?${ ignoreAgentIdParam }`;
				}
				const result = HTTP.call('GET', `${ settings.get('Livechat_External_Queue_URL') }${ queryString }`, {
					headers: {
						'User-Agent': 'RocketChat Server',
						Accept: 'application/json',
						'X-RocketChat-Secret-Token': settings.get('Livechat_External_Queue_Token'),
					},
				});

				if (result && result.data && result.data.username) {
					const agent = Users.findOneOnlineAgentByUserList(result.data.username);

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
}

RoutingManager.registerMethod('External', ExternalQueue);

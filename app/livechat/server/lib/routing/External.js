import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../../../settings';
import { RoutingManager } from '../RoutingManager';
import { Rooms, Users } from '../../../../models';

class ExternalQueue {
	constructor() {
		this.config = {
			previewRoom: false,
			showConnecting: false,
			showQueue: false,
			returnQueue: true,
			enableTriggerAction: true,
		};
	}

	getNextAgent(department) {
		console.log('ExternalQueue.getNextAgent');
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

	delegateInquiry(inquiry, agent) {
		const { department, rid } = inquiry;

		if (!agent || (agent.username && !Users.findOneOnlineAgentByUsername(agent.username))) {
			agent = this.getNextAgent(department);
		}

		RoutingManager.assignAgent(inquiry, agent);
		return Rooms.findOneById(rid);
	}
}

RoutingManager.registerMethod('External', ExternalQueue);

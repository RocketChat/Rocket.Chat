import { Users } from '@rocket.chat/models';
import { isPOSTLivechatAgentStatusProps } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { hasPermission } from '../../../../authorization/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute(
	'livechat/agent.status',
	{ authRequired: true, validateParams: isPOSTLivechatAgentStatusProps },
	{
		async post() {
			const { status } = this.bodyParams;
			let { agentId } = this.bodyParams;
			if (!agentId) {
				agentId = this.userId;
			}

			const agent = await Users.findOneAgentById(agentId, {
				projection: {
					status: 1,
					statusLivechat: 1,
				},
			});
			if (!agent) {
				return API.v1.failure('Agent not found');
			}

			const newStatus = status || (agent.statusLivechat === 'available' ? 'not-available' : 'available');
			if (newStatus === agent.statusLivechat) {
				return API.v1.success();
			}

			if (agentId !== this.userId) {
				if (!hasPermission(this.userId, 'manage-livechat-agents')) {
					return API.v1.unauthorized();
				}
				Livechat.setUserStatusLivechat(agentId, newStatus);

				return API.v1.success();
			}

			if (!Livechat.allowAgentChangeServiceStatus(newStatus, agentId)) {
				return API.v1.failure('error-business-hours-are-closed');
			}

			Livechat.setUserStatusLivechat(agentId, newStatus);

			return API.v1.success();
		},
	},
);

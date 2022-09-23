import { isGETAgentNextToken, isPOSTLivechatAgentStatusProps } from '@rocket.chat/rest-typings';
import { Users } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { findRoom, findGuest, findAgent, findOpenRoom } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { hasPermission } from '../../../../authorization/server';

API.v1.addRoute('livechat/agent.info/:rid/:token', {
	async get() {
		const visitor = await findGuest(this.urlParams.token);
		if (!visitor) {
			throw new Error('invalid-token');
		}

		const room = findRoom(this.urlParams.token, this.urlParams.rid);
		if (!room) {
			throw new Error('invalid-room');
		}

		const agent = room?.servedBy && findAgent(room.servedBy._id);
		if (!agent) {
			throw new Error('invalid-agent');
		}

		return API.v1.success({ agent });
	},
});

API.v1.addRoute(
	'livechat/agent.next/:token',
	{ validateParams: isGETAgentNextToken },
	{
		async get() {
			const { token } = this.urlParams;
			const room = findOpenRoom(token);
			if (room) {
				return API.v1.success();
			}

			let { department } = this.queryParams;
			if (!department) {
				const requireDeparment = Livechat.getRequiredDepartment();
				if (requireDeparment) {
					department = requireDeparment._id;
				}
			}

			const agentData = await Livechat.getNextAgent(department);
			if (!agentData) {
				throw new Error('agent-not-found');
			}

			const agent = findAgent(agentData.agentId);
			if (!agent) {
				throw new Error('invalid-agent');
			}

			return API.v1.success({ agent });
		},
	},
);

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

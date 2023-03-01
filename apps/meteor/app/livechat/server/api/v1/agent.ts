import { isGETAgentNextToken, isPOSTLivechatAgentStatusProps } from '@rocket.chat/rest-typings';
import { Users } from '@rocket.chat/models';
import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus } from '@rocket.chat/core-typings';

import { API } from '../../../../api/server';
import { findRoom, findGuest, findAgent, findOpenRoom } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

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
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isPOSTLivechatAgentStatusProps },
	{
		async post() {
			const { status, agentId: inputAgentId } = this.bodyParams;

			const agentId = inputAgentId || this.userId;

			const agent = await Users.findOneAgentById<Pick<ILivechatAgent, 'status' | 'statusLivechat'>>(agentId, {
				projection: {
					status: 1,
					statusLivechat: 1,
				},
			});
			if (!agent) {
				return API.v1.notFound('Agent not found');
			}

			const newStatus: ILivechatAgentStatus =
				status ||
				(agent.statusLivechat === ILivechatAgentStatus.AVAILABLE ? ILivechatAgentStatus.NOT_AVAILABLE : ILivechatAgentStatus.AVAILABLE);
			if (newStatus === agent.statusLivechat) {
				return API.v1.success({ status: agent.statusLivechat });
			}

			if (agentId !== this.userId) {
				if (!(await hasPermissionAsync(this.userId, 'manage-livechat-agents'))) {
					return API.v1.unauthorized();
				}
				Livechat.setUserStatusLivechat(agentId, newStatus);

				return API.v1.success({ status: newStatus });
			}

			if (!Livechat.allowAgentChangeServiceStatus(newStatus, agentId)) {
				return API.v1.failure('error-business-hours-are-closed');
			}

			Livechat.setUserStatusLivechat(agentId, newStatus);

			return API.v1.success({ status: newStatus });
		},
	},
);

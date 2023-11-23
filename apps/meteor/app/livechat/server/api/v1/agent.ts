import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { isGETAgentNextToken, isPOSTLivechatAgentStatusProps } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { Livechat } from '../../lib/Livechat';
import { Livechat as LivechatTyped } from '../../lib/LivechatTyped';
import { findRoom, findGuest, findAgent, findOpenRoom } from '../lib/livechat';

API.v1.addRoute('livechat/agent.info/:rid/:token', {
	async get() {
		const visitor = await findGuest(this.urlParams.token);
		if (!visitor) {
			throw new Error('invalid-token');
		}

		const room = await findRoom(this.urlParams.token, this.urlParams.rid);
		if (!room) {
			throw new Error('invalid-room');
		}

		const agent = room?.servedBy && (await findAgent(room.servedBy._id));
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
			const room = await findOpenRoom(token);
			if (room) {
				return API.v1.success();
			}

			let { department } = this.queryParams;
			if (!department) {
				const requireDepartment = await LivechatTyped.getRequiredDepartment();
				if (requireDepartment) {
					department = requireDepartment._id;
				}
			}

			const agentData = await LivechatTyped.getNextAgent(department);
			if (!agentData) {
				throw new Error('agent-not-found');
			}

			const agent = await findAgent(agentData.agentId);
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

			const agent = await Users.findOneAgentById<Pick<ILivechatAgent, 'status' | 'statusLivechat' | 'active'>>(agentId, {
				projection: {
					status: 1,
					statusLivechat: 1,
					active: 1,
				},
			});
			if (!agent) {
				return API.v1.notFound('Agent not found');
			}

			if (!agent.active) {
				return API.v1.failure('error-user-deactivated');
			}

			const newStatus: ILivechatAgentStatus =
				status ||
				(agent.statusLivechat === ILivechatAgentStatus.AVAILABLE ? ILivechatAgentStatus.NOT_AVAILABLE : ILivechatAgentStatus.AVAILABLE);
			if (newStatus === agent.statusLivechat) {
				return API.v1.success({ status: agent.statusLivechat });
			}

			const canChangeStatus = await Livechat.allowAgentChangeServiceStatus(newStatus, agentId);

			if (agentId !== this.userId) {
				if (!(await hasPermissionAsync(this.userId, 'manage-livechat-agents'))) {
					return API.v1.unauthorized();
				}

				// Silent fail for admins when BH is closed
				// Next version we'll update this to return an error
				// And update the FE accordingly
				if (canChangeStatus) {
					await Livechat.setUserStatusLivechat(agentId, newStatus);
					return API.v1.success({ status: newStatus });
				}

				return API.v1.success({ status: agent.statusLivechat });
			}

			if (!canChangeStatus) {
				return API.v1.failure('error-business-hours-are-closed');
			}

			await Livechat.setUserStatusLivechat(agentId, newStatus);

			return API.v1.success({ status: newStatus });
		},
	},
);

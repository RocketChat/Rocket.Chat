import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import {
	isGETAgentNextToken,
	isPOSTLivechatAgentSaveInfoParams,
	isPOSTLivechatAgentStatusProps,
	POSTLivechatAgentSaveInfoSuccessResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../../../authorization/server/functions/hasRole';
import { RoutingManager } from '../../lib/RoutingManager';
import { getRequiredDepartment } from '../../lib/departmentsLib';
import { saveAgentInfo } from '../../lib/omni-users';
import { setUserStatusLivechat, allowAgentChangeServiceStatus } from '../../lib/utils';
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
			const room = await findOpenRoom(token, undefined, this.userId);
			if (room) {
				return API.v1.success();
			}

			let { department } = this.queryParams;
			if (!department) {
				const requireDepartment = await getRequiredDepartment();
				if (requireDepartment) {
					department = requireDepartment._id;
				}
			}

			const agentData = await RoutingManager.getNextAgent(department);
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

			const canChangeStatus = await allowAgentChangeServiceStatus(newStatus, agentId);

			if (agentId !== this.userId) {
				if (!(await hasPermissionAsync(this.userId, 'manage-livechat-agents'))) {
					return API.v1.forbidden();
				}

				// Silent fail for admins when BH is closed
				// Next version we'll update this to return an error
				// And update the FE accordingly
				if (canChangeStatus) {
					await setUserStatusLivechat(agentId, newStatus);
					return API.v1.success({ status: newStatus });
				}

				return API.v1.success({ status: agent.statusLivechat });
			}

			if (!canChangeStatus) {
				return API.v1.failure('error-business-hours-are-closed');
			}

			await setUserStatusLivechat(agentId, newStatus);

			return API.v1.success({ status: newStatus });
		},
	},
);

const livechatAgentsEndpoints = API.v1.post(
	'livechat/agents.saveInfo',
	{
		response: {
			200: POSTLivechatAgentSaveInfoSuccessResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
		authRequired: true,
		permissionsRequired: ['manage-livechat-agents'],
		body: isPOSTLivechatAgentSaveInfoParams,
	},
	async function action() {
		const { agentId, agentData, agentDepartments } = this.bodyParams;

		if (!(await hasRoleAsync(agentId, 'livechat-agent'))) {
			return API.v1.failure('error-user-is-not-agent');
		}

		await saveAgentInfo(agentId, agentData, agentDepartments);

		return API.v1.success();
	},
);

type LivechatAgentsEndpoints = ExtractRoutesFromAPI<typeof livechatAgentsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatAgentsEndpoints {}
}

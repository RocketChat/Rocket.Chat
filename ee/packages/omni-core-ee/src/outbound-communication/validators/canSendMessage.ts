import { Authorization } from '@rocket.chat/core-services';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';
import { applyDepartmentRestrictions } from '@rocket.chat/omni-core';
import type { FilterOperators } from 'mongodb';

export async function canSendOutboundMessage(userId: string, agentId?: string, departmentId?: string) {
	// Case 1: Check department and check if agent is in department
	if (departmentId) {
		let query: FilterOperators<ILivechatDepartment> = { _id: departmentId };
		if (!(await Authorization.hasPermission(userId, 'outbound.can-assign-queues'))) {
			query = await applyDepartmentRestrictions(query, userId);
		}

		const department = await LivechatDepartment.findOne<Pick<ILivechatDepartment, '_id' | 'enabled'>>(query, { _id: 1, enabled: 1 });
		if (!department?.enabled) {
			throw new Error('error-invalid-department');
		}

		// Case 2: Agent & department: if agent is present, agent must be in department
		if (agentId) {
			if (!(await Authorization.hasPermission(userId, 'outbound.can-assign-any-agent'))) {
				if ((await Authorization.hasPermission(userId, 'outbound.can-assign-self-only')) && agentId !== userId) {
					throw new Error('error-invalid-agent');
				}
			}

			// On here, we take a shortcut: if the user is here, we assume it's an agent (and we assume the collection is kept up to date :) )
			const agent = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(agentId, departmentId);
			if (!agent) {
				throw new Error('error-agent-not-in-department');
			}
		}
		// Case 3: Agent & no department: if agent is present and there's no department, agent must be an agent
	} else if (agentId) {
		if (!(await Authorization.hasPermission(userId, 'outbound.can-assign-any-agent'))) {
			if ((await Authorization.hasPermission(userId, 'outbound.can-assign-self-only')) && agentId !== userId) {
				throw new Error('error-invalid-agent');
			}
		}

		const agent = await Users.findOneAgentById(agentId, { projection: { _id: 1 } });
		if (!agent) {
			throw new Error('error-agent-not-in-department');
		}
	}
}

import { Authorization } from '@rocket.chat/core-services';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';
import type { FilterOperators } from 'mongodb';

import { addQueryRestrictionsToDepartmentsModel } from '../../units/addRoleBasedRestrictionsToDepartment';

export async function validateAgentAssignPermissions(userId: string, agentId: string): Promise<void> {
	if (await Authorization.hasPermission(userId, 'outbound.can-assign-any-agent')) {
		return;
	}

	if ((await Authorization.hasPermission(userId, 'outbound.can-assign-self-only')) && agentId === userId) {
		return;
	}

	throw new Error('error-invalid-agent');
}

export async function canSendOutboundMessage(userId: string, agentId?: string, departmentId?: string): Promise<void> {
	// Case 1: Check department and check if agent is in department
	if (departmentId) {
		let query: FilterOperators<ILivechatDepartment> = { _id: departmentId };
		if (!(await Authorization.hasPermission(userId, 'outbound.can-assign-queues'))) {
			query = await addQueryRestrictionsToDepartmentsModel(query, userId);
		}

		const department = await LivechatDepartment.findOne<Pick<ILivechatDepartment, '_id' | 'enabled'>>(query, { _id: 1, enabled: 1 });
		if (!department?.enabled) {
			throw new Error('error-invalid-department');
		}

		// Case 2: Agent & department: if agent is present, agent must be in department
		if (agentId) {
			await validateAgentAssignPermissions(userId, agentId);
			// On here, we take a shortcut: if the user is here, we assume it's an agent (and we assume the collection is kept up to date :) )
			const agent = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(agentId, departmentId, { projection: { _id: 1 } });
			if (!agent) {
				throw new Error('error-agent-not-in-department');
			}
		}
		// Case 3: Agent & no department: if agent is present and there's no department, agent must be an agent
	} else if (agentId) {
		await validateAgentAssignPermissions(userId, agentId);

		const agent = await Users.findOneAgentById(agentId, { projection: { _id: 1 } });
		if (!agent) {
			throw new Error('error-invalid-agent');
		}
	}
}

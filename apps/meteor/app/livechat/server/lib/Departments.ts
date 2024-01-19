import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatDepartment, LivechatDepartmentAgents, LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

class DepartmentHelperClass {
	logger = new Logger('Omnichannel:DepartmentHelper');

	async removeDepartment(departmentId: string) {
		this.logger.debug(`Removing department: ${departmentId}`);

		const department = await LivechatDepartment.findOneById(departmentId);
		if (!department) {
			throw new Error('error-department-not-found');
		}

		const { _id } = department;

		const ret = await LivechatDepartment.removeById(_id);
		if (ret.acknowledged !== true) {
			throw new Error('error-failed-to-delete-department');
		}

		const agentsIds: string[] = await LivechatDepartmentAgents.findAgentsByDepartmentId<Pick<ILivechatDepartmentAgents, 'agentId'>>(
			department._id,
			{ projection: { agentId: 1 } },
		)
			.cursor.map((agent) => agent.agentId)
			.toArray();

		this.logger.debug(
			`Performing post-department-removal actions: ${_id}. Removing department agents, unsetting fallback department and removing department from rooms`,
		);

		const promiseResponses = await Promise.allSettled([
			LivechatDepartmentAgents.removeByDepartmentId(_id),
			LivechatDepartment.unsetFallbackDepartmentByDepartmentId(_id),
			LivechatRooms.bulkRemoveDepartmentAndUnitsFromRooms(_id),
		]);
		promiseResponses.forEach((response, index) => {
			if (response.status === 'rejected') {
				this.logger.error(`Error while performing post-department-removal actions: ${_id}. Action No: ${index}. Error:`, response.reason);
			}
		});

		await callbacks.run('livechat.afterRemoveDepartment', { department, agentsIds });

		return ret;
	}
}

export const DepartmentHelper = new DepartmentHelperClass();

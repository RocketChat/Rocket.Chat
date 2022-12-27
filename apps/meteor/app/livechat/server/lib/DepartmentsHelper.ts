import { LivechatDepartment, LivechatDepartmentAgents, LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { Logger } from '../../../logger/server';

class DepartmentHelperClass {
	logger = new Logger('Omnichannel:DepartmentHelper');

	async removeDepartment(departmentId: string) {
		this.logger.debug(`Removing department: ${departmentId}`);

		const department = await LivechatDepartment.findOneById(departmentId, { projection: { _id: 1 } });
		if (!department) {
			this.logger.debug(`Department not found: ${departmentId}`);
			throw new Error('error-department-not-found');
		}

		const { _id } = department;

		const ret = await LivechatDepartment.removeById(_id);
		if (ret.acknowledged !== true) {
			this.logger.error(`Department record not removed: ${_id}. Result from db: ${ret}`);
			throw new Error('error-failed-to-delete-department');
		}
		this.logger.debug(`Department record removed: ${_id}`);

		const agentsIds = LivechatDepartmentAgents.findAgentsByDepartmentId(department._id).cursor.map((agent) => agent.agentId);

		this.logger.debug(
			`Performing post-department-removal actions: ${_id}. Removing department agents, unsetting fallback department and removing department from rooms`,
		);

		await Promise.all([
			LivechatDepartmentAgents.removeByDepartmentId(_id),
			LivechatDepartment.unsetFallbackDepartmentByDepartmentId(_id),
			LivechatRooms.bulkRemoveDepartmentFromRooms(_id),
		]);

		this.logger.debug(`Post-department-removal actions completed: ${_id}. Notifying callbacks with department and agentsIds`);

		Meteor.defer(() => {
			callbacks.run('livechat.afterRemoveDepartment', { department, agentsIds });
		});

		return ret;
	}
}

export const DepartmentHelper = new DepartmentHelperClass();

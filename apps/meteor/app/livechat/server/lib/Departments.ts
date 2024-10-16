import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatDepartment, LivechatDepartmentAgents, LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChanged } from '../../../lib/server/lib/notifyListener';

class DepartmentHelperClass {
	logger = new Logger('Omnichannel:DepartmentHelper');

	async removeDepartment(departmentId: string) {
		this.logger.debug(`Removing department: ${departmentId}`);

		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'businessHourId'>>(departmentId, {
			projection: { _id: 1, businessHourId: 1 },
		});
		if (!department) {
			throw new Error('error-department-not-found');
		}

		const { _id } = department;

		const ret = await LivechatDepartment.removeById(_id);
		if (ret.acknowledged !== true) {
			throw new Error('error-failed-to-delete-department');
		}

		const removedAgents = await LivechatDepartmentAgents.findByDepartmentId(department._id, { projection: { agentId: 1 } }).toArray();

		this.logger.debug(
			`Performing post-department-removal actions: ${_id}. Removing department agents, unsetting fallback department and removing department from rooms`,
		);

		const removeByDept = LivechatDepartmentAgents.removeByDepartmentId(_id);

		const promiseResponses = await Promise.allSettled([
			removeByDept,
			LivechatDepartment.unsetFallbackDepartmentByDepartmentId(_id),
			LivechatRooms.bulkRemoveDepartmentAndUnitsFromRooms(_id),
		]);

		promiseResponses.forEach((response, index) => {
			if (response.status === 'rejected') {
				this.logger.error(`Error while performing post-department-removal actions: ${_id}. Action No: ${index}. Error:`, response.reason);
			}
		});

		const { deletedCount } = await removeByDept;

		if (deletedCount > 0) {
			removedAgents.forEach(({ _id: docId, agentId }) => {
				void notifyOnLivechatDepartmentAgentChanged(
					{
						_id: docId,
						agentId,
						departmentId: _id,
					},
					'removed',
				);
			});
		}

		await callbacks.run('livechat.afterRemoveDepartment', { department, agentsIds: removedAgents.map(({ agentId }) => agentId) });

		return ret;
	}
}

export const DepartmentHelper = new DepartmentHelperClass();

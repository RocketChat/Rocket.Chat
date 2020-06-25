import { callbacks } from '../../../../../app/callbacks/server';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';
import { LivechatDepartment } from '../../../../../app/models/server';

// callbacks.add('livechat.removeAgentDepartment', async (options: any = {}) => {
// 	const { departmentId, agentsId } = options;
// 	const department = LivechatDepartment.findOneById(departmentId, { fields: { businessHourId: 1 } });
// 	if (!department || !department.businessHourId) {
// 		return options;
// 	}
//
// 	// await businessHourManager.removeBusinessHourFromUsersByIds(agentsId, department.businessHourId);
// 	// await businessHourManager.setDefaultToUsersIfNeeded(agentsId);
// 	return options;
// }, callbacks.priority.HIGH, 'livechat-on-remove-agent-department');

// callbacks.add('livechat.saveAgentDepartment', async (options: any = {}) => {
// 	const { departmentId, agentsId } = options;
// 	const department = LivechatDepartment.findOneById(departmentId, { fields: { businessHourId: 1 } });
// 	if (!department || !department.businessHourId) {
// 		return options;
// 	}
//
// 	// await businessHourManager.addBusinessHourToUsersByIds(agentsId, department.businessHourId);
//
// 	return options;
// }, callbacks.priority.HIGH, 'livechat-on-save-agent-department');

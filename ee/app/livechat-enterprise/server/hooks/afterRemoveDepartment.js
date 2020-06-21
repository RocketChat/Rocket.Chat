import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';

callbacks.add('livechat.afterRemoveDepartment', (department) => {
	if (!department) {
		return department;
	}
	LivechatDepartment.removeDepartmentFromForwardListById(department._id);
	const deletedDepartment = LivechatDepartment.trashFindOneById(department._id);
	if (!deletedDepartment.businessHourId) {
		return department;
	}
	Promise.await(businessHourManager.removeBusinessHourIdFromUsers(deletedDepartment));
	return department;
}, callbacks.priority.HIGH, 'livechat-after-remove-department');

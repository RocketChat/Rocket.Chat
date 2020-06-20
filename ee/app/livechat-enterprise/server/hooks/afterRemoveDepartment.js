import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';

callbacks.add('livechat.afterRemoveDepartment', (department) => {
	if (!department) {
		return department;
	}
	LivechatDepartment.removeDepartmentFromForwardListById(department._id);
	if (!department.businessHourId) {
		return department;
	}
	Promise.await(businessHourManager.removeBusinessHourById(department._id));
	return department;
}, callbacks.priority.HIGH, 'livechat-after-remove-department');

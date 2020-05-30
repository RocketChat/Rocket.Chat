import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';

callbacks.add('livechat.afterRemoveDepartment', (department) => {
	if (!department) {
		return department;
	}
	LivechatDepartment.removeDepartmentFromForwardListById(department._id);
	return department;
}, callbacks.priority.HIGH, 'livechat-after-remove-department');

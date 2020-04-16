import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';

callbacks.add('livechat.afterRemoveDepartment', (department) => {
	if (!department) {
		return;
	}
	LivechatDepartment.removeDepartmentFromForwardListById(department._id);
}, callbacks.priority.HIGH, 'livechat-after-remove-department');

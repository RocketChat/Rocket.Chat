import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../server/models';

callbacks.add('livechat.afterRemoveDepartment', (options = {}) => {
	const { department } = options;
	if (!department) {
		return options;
	}
	LivechatDepartment.removeDepartmentFromForwardListById(department._id);
	return options;
}, callbacks.priority.HIGH, 'livechat-after-remove-department');

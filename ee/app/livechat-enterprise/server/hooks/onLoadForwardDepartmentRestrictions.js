import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';

callbacks.add('livechat.onLoadForwardDepartmentRestrictions', (options = {}) => {
	const { departmentId } = options;
	if (!departmentId) {
		return options;
	}
	const department = LivechatDepartment.findOneById(departmentId, { fields: { departmentsAllowedToForward: 1 } });
	if (!department) {
		return options;
	}
	const { departmentsAllowedToForward } = department;
	if (!departmentsAllowedToForward) {
		return options;
	}
	return Object.assign({ restrictions: { _id: { $in: departmentsAllowedToForward } } }, options);
}, callbacks.priority.MEDIUM, 'livechat-on-load-forward-department-restrictions');

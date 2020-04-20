import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';

callbacks.add('livechat.onLoadForwardDepartmentRestrictions', (departmentId) => {
	if (!departmentId) {
		return {};
	}
	const department = LivechatDepartment.findOneById(departmentId, { fields: { departmentsAllowedToForward: 1 } });
	if (!department) {
		return {};
	}
	const { departmentsAllowedToForward } = department;
	if (!departmentsAllowedToForward) {
		return {};
	}
	return { _id: { $in: departmentsAllowedToForward } };
}, callbacks.priority.MEDIUM, 'livechat-on-load-forward-department-restrictions');

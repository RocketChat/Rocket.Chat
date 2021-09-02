import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';
import { logger } from '../lib/logger';

callbacks.add('livechat.onLoadForwardDepartmentRestrictions', (options = {}) => {
	const { departmentId } = options;
	if (!departmentId) {
		logger.cb.debug('Skipping callback. No departmentId provided');
		return options;
	}
	const department = LivechatDepartment.findOneById(departmentId, { fields: { departmentsAllowedToForward: 1 } });
	if (!department) {
		logger.cb.debug('Skipping callback. Invalid department provided');
		return options;
	}
	const { departmentsAllowedToForward, _id } = department;
	if (!departmentsAllowedToForward) {
		logger.cb.debug(`Skipping callback. Department ${ _id } doesnt allow forwarding to other departments`);
		return options;
	}
	return Object.assign({ restrictions: { _id: { $in: departmentsAllowedToForward } } }, options);
}, callbacks.priority.MEDIUM, 'livechat-on-load-forward-department-restrictions');

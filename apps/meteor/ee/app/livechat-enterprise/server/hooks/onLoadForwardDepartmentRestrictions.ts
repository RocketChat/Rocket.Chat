import { LivechatDepartment } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.onLoadForwardDepartmentRestrictions',
	async (options) => {
		const { departmentId } = options;
		if (!departmentId) {
			cbLogger.debug('Skipping callback. No departmentId provided');
			return options;
		}
		const department = await LivechatDepartment.findOneById(departmentId, {
			projection: { departmentsAllowedToForward: 1 },
		});
		if (!department) {
			cbLogger.debug('Skipping callback. Invalid department provided');
			return options;
		}
		const { departmentsAllowedToForward, _id } = department;
		if (!departmentsAllowedToForward) {
			cbLogger.debug(`Skipping callback. Department ${_id} doesnt allow forwarding to other departments`);
			return options;
		}
		return Object.assign({ restrictions: { _id: { $in: departmentsAllowedToForward } } }, options);
	},
	callbacks.priority.MEDIUM,
	'livechat-on-load-forward-department-restrictions',
);

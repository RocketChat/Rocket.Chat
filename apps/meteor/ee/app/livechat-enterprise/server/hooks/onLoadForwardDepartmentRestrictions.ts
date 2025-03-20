import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.onLoadForwardDepartmentRestrictions',
	async (options) => {
		const { departmentId } = options;
		if (!departmentId) {
			return options;
		}
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'departmentsAllowedToForward'>>(departmentId, {
			projection: { departmentsAllowedToForward: 1 },
		});
		if (!department) {
			return options;
		}
		const { departmentsAllowedToForward } = department;
		if (!departmentsAllowedToForward) {
			return options;
		}
		return Object.assign({ restrictions: { _id: { $in: departmentsAllowedToForward } } }, options);
	},
	callbacks.priority.MEDIUM,
	'livechat-on-load-forward-department-restrictions',
);

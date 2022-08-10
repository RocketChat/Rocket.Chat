import { LivechatDepartment } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.afterRemoveDepartment',
	(options = {}) => {
		const { department } = options;
		if (!department) {
			return options;
		}
		Promise.await(LivechatDepartment.removeDepartmentFromForwardListById(department._id));
		return options;
	},
	callbacks.priority.HIGH,
	'livechat-after-remove-department',
);

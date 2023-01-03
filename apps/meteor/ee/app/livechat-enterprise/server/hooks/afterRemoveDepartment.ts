import type { ILivechatAgent, ILivechatDepartmentRecord } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

const afterRemoveDepartment = async (options: { department: ILivechatDepartmentRecord; agentsId: ILivechatAgent['_id'][] }) => {
	cbLogger.debug(`Performing post-department-removal actions in EE: ${options?.department?._id}. Removing department from forward list`);
	if (!options || !options.department) {
		cbLogger.warn('No department found in options', options);
		return options;
	}

	const { department } = options;

	cbLogger.debug(`Removing department from forward list: ${department._id}`);
	await LivechatDepartment.removeDepartmentFromForwardListById(department._id);
	cbLogger.debug(`Removed department from forward list: ${department._id}`);

	cbLogger.debug(`Post-department-removal actions completed in EE: ${department._id}`);

	return options;
};

callbacks.add(
	'livechat.afterRemoveDepartment',
	(options) => Promise.await(afterRemoveDepartment(options)),
	callbacks.priority.HIGH,
	'livechat-after-remove-department',
);

import type { AtLeast, ILivechatAgent, ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatUnit } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

const afterRemoveDepartment = async (options: {
	department: AtLeast<ILivechatDepartment, '_id' | 'businessHourId' | 'parentId'>;
	agentsId: ILivechatAgent['_id'][];
}) => {
	if (!options?.department) {
		cbLogger.warn('No department found in options', options);
		return options;
	}

	const { department } = options;

	cbLogger.debug({
		msg: 'Post removal actions on EE code for department',
		department,
	});
	await Promise.all([
		LivechatDepartment.removeDepartmentFromForwardListById(department._id),
		...(department.parentId ? [LivechatUnit.decrementDepartmentsCount(department.parentId)] : []),
	]);

	return options;
};

callbacks.add(
	'livechat.afterRemoveDepartment',
	(options) => afterRemoveDepartment(options),
	callbacks.priority.HIGH,
	'livechat-after-remove-department',
);

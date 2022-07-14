import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatDepartment } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

export const findAllDepartmentsAvailable = async (uid, unitId, offset, count, text, onlyMyDepartments = false) => {
	const filterReg = new RegExp(escapeRegExp(text), 'i');

	let query = {
		type: { $ne: 'u' },
		$or: [{ ancestors: { $in: [[unitId], null, []] } }, { ancestors: { $exists: false } }],
		...(text && { name: filterReg }),
	};

	if (onlyMyDepartments) {
		query = callbacks.run('livechat.applyDepartmentRestrictions', query, { userId: uid });
	}

	const { cursor, totalCount } = LivechatDepartment.findPaginated(query, { limit: count, offset });

	const [departments, total] = await Promise.all([cursor.toArray(), totalCount]);

	return { departments, total };
};

export const findAllDepartmentsByUnit = async (unitId, offset, count) => {
	const { cursor, totalCount } = LivechatDepartment.findPaginated(
		{
			ancestors: { $in: [unitId] },
		},
		{ limit: count, offset },
	);

	const [departments, total] = await Promise.all([cursor.toArray(), totalCount]);

	return { departments, total };
};

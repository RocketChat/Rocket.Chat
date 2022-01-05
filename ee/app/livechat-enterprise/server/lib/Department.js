import { escapeRegExp } from '@rocket.chat/string-helpers';

import { callbacks } from '../../../../../lib/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server/raw';

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

	const cursor = LivechatDepartment.find(query, { limit: count, offset });

	const departments = await cursor.toArray();
	const total = await cursor.count();

	return { departments, total };
};

export const findAllDepartmentsByUnit = async (unitId, offset, count) => {
	const cursor = LivechatDepartment.find(
		{
			ancestors: { $in: [unitId] },
		},
		{ limit: count, offset },
	);

	const total = await cursor.count();
	const departments = await cursor.toArray();

	return { departments, total };
};

import { escapeRegExp } from '@rocket.chat/string-helpers';

import LivechatTag from '../../../models/server/models/LivechatTag';
import {
	LivechatDepartment,
} from '../../../../../app/models/server/raw';

export const findAllDepartmentsAvailable = async (unitId, offset, count, text) => {
	const filterReg = new RegExp(escapeRegExp(text), 'i');

	const cursor = LivechatDepartment.find({
		type: { $ne: 'u' },
		$or: [{ ancestors: { $in: [[unitId], null, []] } }, { ancestors: { $exists: false } }],
		...text && { name: filterReg },

	}, { limit: count, offset });

	const departments = await cursor.toArray();
	const total = await cursor.count();

	return { departments, total };
};

export const findAllDepartmentsByUnit = async (unitId, offset, count) => {
	const cursor = LivechatDepartment.find({
		ancestors: { $in: [unitId] },
	}, { limit: count, offset });

	const total = await cursor.count();
	const departments = await cursor.toArray();

	return { departments, total };
};

export const findAllDepartmentsByTag = async (tagId, offset, count) => {
	const tag = LivechatTag.findOneById(tagId);

	let departmentsResult = [];
	let total = 0;

	if (!tag) {
		return { departments: departmentsResult, total };
	}

	if (tag.departments && tag.departments.length) {
		const cursor = LivechatDepartment.findInIds(tag.departments, { limit: count, offset });
		const departments = await cursor.toArray();
		total = await cursor.count();
		departmentsResult = departments;
	}

	return { departments: departmentsResult, total };
};

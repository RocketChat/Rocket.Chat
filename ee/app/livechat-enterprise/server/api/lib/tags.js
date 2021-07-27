import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatTag from '../../../../models/server/raw/LivechatTag';

export async function findTags({ userId, text, departmentId, viewAll = false, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-tags') && !await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const viewAllTags = !!await hasPermissionAsync(userId, 'view-all-livechat-tags');
	// return either tags by department or tags without a department to user
	const byDepartment = departmentId ? { $or: [{ departments: departmentId }, { numDepartments: 0 }] } : { numDepartments: 0 };
	const viewAllFilter = viewAllTags && viewAll ? {} : byDepartment;

	const filterReg = new RegExp(escapeRegExp(text), 'i');
	const query = {
		$and: [
			...text ? [{ $or: [{ name: filterReg }, { description: filterReg }] }] : [],
			...[viewAllFilter],
		],
	};

	const cursor = LivechatTag.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const tags = await cursor.toArray();

	return {
		tags,
		count: tags.length,
		offset,
		total,
	};
}

export async function findTagById({ userId, tagId }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-tags') && !await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}
	return LivechatTag.findOneById(tagId);
}

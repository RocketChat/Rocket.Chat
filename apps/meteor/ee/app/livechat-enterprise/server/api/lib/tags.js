import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatTag from '../../../../models/server/raw/LivechatTag';

export async function findTags({ userId, text, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-tags')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	const filterReg = new RegExp(escapeRegExp(text), 'i');
	const query = { ...(text && { $or: [{ name: filterReg }, { description: filterReg }] }) };

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
	if (!(await hasPermissionAsync(userId, 'manage-livechat-tags')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	return LivechatTag.findOneById(tagId);
}

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatTag from '../../../../models/server/raw/LivechatTag';

export async function findTags({ userId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-tags')) {
		throw new Error('error-not-authorized');
	}
	const cursor = LivechatTag.find({}, {
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
	if (!await hasPermissionAsync(userId, 'manage-livechat-tags')) {
		throw new Error('error-not-authorized');
	}
	return LivechatTag.findOneById(tagId);
}

export async function findTagsToAutocomplete({ uid, selector }) {
	if (!await hasPermissionAsync(uid, 'manage-livechat-tags') && !await hasPermissionAsync(uid, 'view-l-room')) {
		return { items: [] };
	}
	const { exceptions = [], conditions = {} } = selector;

	const options = {
		fields: {
			_id: 1,
			name: 1,
		},
		limit: 10,
		sort: {
			name: 1,
		},
	};

	const items = await LivechatTag.findByNameRegexWithExceptionsAndConditions(selector.term, exceptions, conditions, options).toArray();
	return {
		items,
	};
}

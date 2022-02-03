import { escapeRegExp } from '@rocket.chat/string-helpers';

import { LivechatCustomFieldRaw } from '../../../../models/server/raw/LivechatCustomField';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatCustomField } from '../../../../models/server/raw';

export async function findLivechatCustomFields({ userId: any, text: string, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const query = {
		...(text && {
			$or: [{ label: new RegExp(escapeRegExp(text), 'i') }, { _id: new RegExp(escapeRegExp(text), 'i') }],
		}),
	};

	const cursor = await LivechatCustomField.find(query, {
		sort: sort || { label: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const customFields = await cursor.toArray();

	return {
		customFields,
		count: customFields.length,
		offset,
		total,
	};
}

export async function findCustomFieldById({
	userId,
	customFieldId,
}: {
	userId: any;
	customFieldId: any;
}): Promise<LivechatCustomFieldRaw | undefined> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	return {
		customField: await LivechatCustomField.findOneById(customFieldId),
	};
}

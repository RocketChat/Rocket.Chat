import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatCustomField } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

export async function findLivechatCustomFields({ userId, text, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const query = {
		...(text && {
			$or: [{ label: new RegExp(escapeRegExp(text), 'i') }, { _id: new RegExp(escapeRegExp(text), 'i') }],
		}),
	};

	const { cursor, totalCount } = LivechatCustomField.findPaginated(query, {
		sort: sort || { label: 1 },
		skip: offset,
		limit: count,
	});

	const [customFields, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		customFields,
		count: customFields.length,
		offset,
		total,
	};
}

export async function findCustomFieldById({ userId, customFieldId }) {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	return {
		customField: await LivechatCustomField.findOneById(customFieldId),
	};
}

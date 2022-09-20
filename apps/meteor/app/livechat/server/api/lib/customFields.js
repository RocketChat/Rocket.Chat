import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatCustomField } from '@rocket.chat/models';

export async function findLivechatCustomFields({ text, pagination: { offset, count, sort } }) {
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

export async function findCustomFieldById({ customFieldId }) {
	return {
		customField: await LivechatCustomField.findOneById(customFieldId),
	};
}

import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatCustomField } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ILivechatCustomField } from '@rocket.chat/core-typings';

export async function findLivechatCustomFields({
	text,
	pagination: { offset, count, sort },
}: {
	text?: string;
	pagination: { offset: number; count: number; sort: Record<string, number> };
}): Promise<PaginatedResult<{ customFields: Array<ILivechatCustomField> }>> {
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

export async function findCustomFieldById({
	customFieldId,
}: {
	customFieldId: string;
}): Promise<{ customField: ILivechatCustomField | null }> {
	return {
		customField: await LivechatCustomField.findOneById(customFieldId),
	};
}

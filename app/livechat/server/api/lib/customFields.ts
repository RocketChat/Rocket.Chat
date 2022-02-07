import { escapeRegExp } from '@rocket.chat/string-helpers';

import { LivechatCustomField } from '../../../../models/server/raw/index';
import { ILivechatCustomField } from '../../../../../definition/ILivechatCustomField';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

export interface IFindLIveChatCustomFields {
	customFields: ILivechatCustomField[];
	count: number;
	offset: number;
	total: number;
}

export async function findLivechatCustomFields(
	userId: string,
	text: string,
	{ offset, count, sort }: { offset: number; count: number; sort: string },
): Promise<{ customFields: ILivechatCustomField[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const query = {
		...(text && {
			$or: [{ label: new RegExp(escapeRegExp(text), 'i') }, { _id: new RegExp(escapeRegExp(text), 'i') }],
		}),
	};

	const cursor = LivechatCustomField.find(query, {
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
}): Promise<{ customField: ILivechatCustomField | null }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	return {
		customField: await LivechatCustomField.findOneById(customFieldId),
	};
}

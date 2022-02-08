import { escapeRegExp } from '@rocket.chat/string-helpers';

import { LivechatCustomField } from '../../../../models/server/raw/index';
import { ILivechatCustomField } from '../../../../../definition/ILivechatCustomField';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

export async function findLivechatCustomFields({
	userId,
	text,
	pagination,
}: {
	userId: string;
	text: string;
	pagination: { offset: number; count: number; sort: number };
}): Promise<{ customFields: ILivechatCustomField[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const query = {
		...(text && {
			$or: [{ label: new RegExp(escapeRegExp(text), 'i') }, { _id: new RegExp(escapeRegExp(text), 'i') }],
		}),
	};

	const cursor = LivechatCustomField.find(query, {
		sort: pagination.sort || { label: 1 },
		skip: pagination.offset,
		limit: pagination.count,
	});

	const total = await cursor.count();

	const customFields = await cursor.toArray();

	return {
		customFields,
		count: customFields.length,
		offset: pagination.offset,
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

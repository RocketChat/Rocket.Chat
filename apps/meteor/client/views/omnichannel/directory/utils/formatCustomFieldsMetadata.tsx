import type { ILivechatCustomField, Serialized } from '@rocket.chat/core-typings';

import type { CustomFieldMetadata } from '../../../../components/CustomFieldsFormV2';

export const formatCustomFieldsMetadata = (
	customFields: Serialized<ILivechatCustomField>[],
	scope: 'visitor' | 'room',
): CustomFieldMetadata[] => {
	if (!customFields) {
		return [];
	}

	return customFields
		.filter((field) => field.visibility === 'visible' && field.scope === scope)
		.map(({ _id, label, options, defaultValue, required }) => ({
			name: _id,
			label,
			type: options ? 'select' : 'text',
			required,
			defaultValue,
			options: options?.split(',').map((item) => [item.trim(), item.trim()]),
		}));
};

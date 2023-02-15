import type { ILivechatCustomField, Serialized } from '@rocket.chat/core-typings';

type CustomFieldsMetadata = Record<
	string,
	{
		label: string;
		type: 'select' | 'text';
		required?: boolean;
		defaultValue?: unknown;
		options?: string[];
	}
>;

export const formatCustomFieldsMetadata = (
	customFields: Serialized<ILivechatCustomField>[],
	scope: 'visitor' | 'room',
): CustomFieldsMetadata => {
	if (!customFields) {
		return {};
	}

	return customFields
		.filter((field) => field.visibility === 'visible' && field.scope === scope)
		.reduce((obj, { _id, label, options, defaultValue, required }) => {
			obj[_id] = {
				label,
				type: options ? 'select' : 'text',
				required,
				defaultValue,
				options: options?.split(',').map((item) => item.trim()),
			};
			return obj;
		}, {} as CustomFieldsMetadata);
};

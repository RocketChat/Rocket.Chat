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

export const formatCustomFieldsMetadata = (customFields: Serialized<ILivechatCustomField>[]): CustomFieldsMetadata => {
	if (!customFields) {
		return {};
	}

	return customFields
		.filter(({ visibility, scope }) => visibility === 'visible' && scope === 'visitor')
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

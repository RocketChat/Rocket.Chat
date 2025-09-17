import type { ILivechatCustomField } from '@rocket.chat/core-typings';

import { parseMeteorResponse } from '../parseMeteorResponse';
import type { BaseTest } from '../test';

type CustomField = Omit<ILivechatCustomField, '_id' | '_updatedAt'> & { field: string };

export const removeCustomField = (api: BaseTest['api'], id: string) => {
	return api.post('/v1/livechat/custom-fields.delete', {
		customFieldId: id,
	});
};

export const createCustomField = async (api: BaseTest['api'], overwrites: Partial<CustomField>) => {
	const response = await api.post('/v1/livechat/custom-fields.save', {
		customFieldId: null,
		customFieldData: {
			field: overwrites.field,
			label: overwrites.label || overwrites.field,
			visibility: 'visible',
			scope: 'visitor',
			searchable: false,
			regexp: '',
			type: 'input',
			required: false,
			defaultValue: '',
			options: '',
			public: false,
			...overwrites,
		},
	});

	if (!response.ok()) {
		throw new Error(`Failed to create custom field [http status: ${response.status()}]`);
	}

	const customField = await parseMeteorResponse<CustomField & { _id: string }>(response);

	return {
		response,
		customField,
		delete: () => removeCustomField(api, customField._id),
	};
};

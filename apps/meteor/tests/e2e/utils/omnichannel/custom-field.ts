import type { ILivechatCustomField } from '@rocket.chat/core-typings';

import { parseMeteorResponse } from '../parseMeteorResponse';
import type { BaseTest } from '../test';

type CustomField = Omit<ILivechatCustomField, '_id' | '_updatedAt'> & { field: string };

export const removeCustomField = (api: BaseTest['api'], id: string) => {
	return api.post('/method.call/livechat:deleteCustomField', {
		method: 'livechat:saveCustomField',
		params: [id],
		id: 'id',
		msg: 'method',
	});
};

export const createCustomField = async (api: BaseTest['api'], overwrides: Partial<CustomField>) => {
	const response = await api.post('/method.call/livechat:saveCustomField', {
		message: JSON.stringify({
			method: 'livechat:saveCustomField',
			params: [
				null,
				{
					field: overwrides.field,
					label: overwrides.label || overwrides.field,
					visibility: 'visible',
					scope: 'visitor',
					searchable: false,
					regexp: '',
					type: 'input',
					required: false,
					defaultValue: '',
					options: '',
					public: false,
					...overwrides,
				},
			],
			id: 'id',
			msg: 'method',
		}),
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

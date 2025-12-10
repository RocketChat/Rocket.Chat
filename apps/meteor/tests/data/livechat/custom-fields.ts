import type { ILivechatCustomField } from '@rocket.chat/core-typings';

import { credentials, request, api } from '../api-data';

type ExtendedCustomField = Omit<ILivechatCustomField, '_id' | '_updatedAt'> & { field: string };

export const createCustomField = async (customFieldData: ExtendedCustomField): Promise<ExtendedCustomField> => {
	const response = await request
		.get(api(`livechat/custom-fields/${customFieldData.label}`))
		.set(credentials)
		.send();

	if (response.body.customField) {
		return response.body.customField;
	}

	const { body } = await request.post(api('livechat/custom-fields.save')).set(credentials).send({ customFieldData });

	return body.customField;
};

export const deleteCustomField = async (customFieldId: string) => {
	console.log(`Deleting custom field with id: ${customFieldId}`);
	const { body } = await request.post(api('livechat/custom-fields.delete')).set(credentials).send({
		customFieldId,
	});

	return body;
};

import { credentials, request, api } from './api-data.js';

export const customFieldText = {
	type: 'text',
	required: true,
	minLength: 2,
	maxLength: 10,
};

export function setCustomFields(customFields) {
	const stringified = customFields ? JSON.stringify(customFields) : '';

	return request.post(api('settings/Accounts_CustomFields')).set(credentials).send({ value: stringified }).expect(200);
}

export function clearCustomFields() {
	return setCustomFields(null);
}

import { settings } from '/app/settings';
import { validateCustomFields, saveCustomFieldsWithoutValidation } from '.';
import s from 'underscore.string';

export const saveCustomFields = function(userId, formData) {
	if (s.trim(settings.get('Accounts_CustomFields')) !== '') {
		validateCustomFields(formData);
		return saveCustomFieldsWithoutValidation(userId, formData);
	}
};

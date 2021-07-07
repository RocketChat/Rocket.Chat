import s from 'underscore.string';

import { settings } from '../../../settings';
import { validateCustomFields, saveCustomFieldsWithoutValidation } from '.';

export const saveCustomFields = function(userId, formData) {
	if (s.trim(settings.get('Accounts_CustomFields')) !== '') {
		validateCustomFields(formData);
		return saveCustomFieldsWithoutValidation(userId, formData);
	}
};

import s from 'underscore.string';

import { settings } from '../../../settings/server';
import { validateCustomFields, saveCustomFieldsWithoutValidation } from '.';

export const saveCustomFields = function (userId: string, formData: unknown): void {
	if (s.trim(settings.get('Accounts_CustomFields')) !== '') {
		validateCustomFields(formData);
		return saveCustomFieldsWithoutValidation(userId, formData);
	}
};

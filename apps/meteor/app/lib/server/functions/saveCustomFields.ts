import { settings } from '../../../settings/server';
import { validateCustomFields, saveCustomFieldsWithoutValidation } from '.';
import { trim } from '../../../../lib/utils/stringUtils';

export const saveCustomFields = function (userId: string, formData: unknown): void {
	if (trim(settings.get('Accounts_CustomFields')) !== '') {
		validateCustomFields(formData);
		return saveCustomFieldsWithoutValidation(userId, formData);
	}
};

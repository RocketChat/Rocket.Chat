import { settings } from '../../../settings/server';
import { validateCustomFields, saveCustomFieldsWithoutValidation } from '.';
import { trim } from '../../../../lib/utils/stringUtils';

export const saveCustomFields = async function (userId: string, formData: unknown): Promise<void> {
	if (trim(settings.get('Accounts_CustomFields')) !== '') {
		validateCustomFields(formData);
		return saveCustomFieldsWithoutValidation(userId, formData);
	}
};

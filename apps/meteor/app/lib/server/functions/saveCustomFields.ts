import { trim } from '../../../../lib/utils/stringUtils';
import { settings } from '../../../settings/server';
import { saveCustomFieldsWithoutValidation } from './saveCustomFieldsWithoutValidation';
import { validateCustomFields } from './validateCustomFields';

export const saveCustomFields = async function (userId: string, formData: Record<string, any>): Promise<void> {
	if (trim(settings.get('Accounts_CustomFields')) !== '') {
		validateCustomFields(formData);
		return saveCustomFieldsWithoutValidation(userId, formData);
	}
};

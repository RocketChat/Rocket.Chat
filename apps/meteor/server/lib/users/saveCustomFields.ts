import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { saveCustomFieldsWithoutValidation } from './saveCustomFieldsWithoutValidation';
import { validateCustomFields } from './validateCustomFields';
import { settings } from '../../../app/settings/server';
import { trim } from '../../../lib/utils/stringUtils';

export const saveCustomFields = async function (
	userId: string,
	formData: Record<string, any>,
	options?: { _updater?: Updater<IUser>; session?: ClientSession },
): Promise<void> {
	if (trim(settings.get('Accounts_CustomFields')).length === 0) {
		return;
	}

	validateCustomFields(formData);
	return saveCustomFieldsWithoutValidation(userId, formData, options);
};

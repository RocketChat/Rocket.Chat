import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { LivechatCustomField, LivechatRooms, LivechatVisitors } from '@rocket.chat/models';

import { livechatLogger } from './logger';
import { i18n } from '../../../utils/lib/i18n';

export const validateRequiredCustomFields = (customFields: string[], livechatCustomFields: ILivechatCustomField[]) => {
	const errors: string[] = [];
	const requiredCustomFields = livechatCustomFields.filter((field) => field.required);

	requiredCustomFields.forEach((field) => {
		if (!customFields.find((f) => f === field._id)) {
			errors.push(field._id);
		}
	});

	if (errors.length > 0) {
		throw new Error(`Missing required custom fields: ${errors.join(', ')}`);
	}
};

export async function setCustomFields({ token, key, value, overwrite }: { key: string; value: string; overwrite: boolean; token: string }) {
	livechatLogger.debug(`Setting custom fields data for visitor with token ${token}`);

	const customField = await LivechatCustomField.findOneById(key);
	if (!customField) {
		throw new Error('invalid-custom-field');
	}

	if (customField.regexp !== undefined && customField.regexp !== '') {
		const regexp = new RegExp(customField.regexp);
		if (!regexp.test(value)) {
			throw new Error(i18n.t('error-invalid-custom-field-value', { field: key }));
		}
	}

	let result;
	if (customField.scope === 'room') {
		result = await LivechatRooms.updateDataByToken(token, key, value, overwrite);
	} else {
		result = await LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
	}

	if (typeof result === 'boolean') {
		// Note: this only happens when !overwrite is passed, in this case we don't do any db update
		return 0;
	}

	return result.modifiedCount;
}

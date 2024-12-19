import type { AtLeast, ILivechatCustomField } from '@rocket.chat/core-typings';

import { trim } from '../../../../../lib/utils/stringUtils';
import { i18n } from '../../../../utils/lib/i18n';

export function validateCustomFields(
	allowedCustomFields: AtLeast<ILivechatCustomField, '_id'>[],
	customFields: Record<string, string | unknown>,
	{
		ignoreAdditionalFields = false,
		ignoreValidationErrors = false,
	}: { ignoreAdditionalFields?: boolean; ignoreValidationErrors?: boolean } = {},
): Record<string, string> {
	const validValues: Record<string, string> = {};

	for (const cf of allowedCustomFields) {
		if (!customFields.hasOwnProperty(cf._id)) {
			if (cf.required && !ignoreValidationErrors) {
				throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label || cf._id }));
			}
			continue;
		}
		const cfValue: string = trim(customFields[cf._id]);

		if (!cfValue || typeof cfValue !== 'string') {
			if (cf.required && !ignoreValidationErrors) {
				throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label || cf._id }));
			}
			continue;
		}

		if (cf.regexp) {
			const regex = new RegExp(cf.regexp);
			if (!regex.test(cfValue)) {
				if (ignoreValidationErrors) {
					continue;
				}

				throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label || cf._id }));
			}
		}

		validValues[cf._id] = cfValue;
	}

	if (!ignoreAdditionalFields) {
		const allowedCustomFieldIds = new Set(allowedCustomFields.map((cf) => cf._id));
		for (const key in customFields) {
			if (!allowedCustomFieldIds.has(key)) {
				throw new Error(i18n.t('error-custom-field-not-allowed', { key }));
			}
		}
	}

	return validValues;
}

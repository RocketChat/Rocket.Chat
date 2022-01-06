import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { settings } from '../../../settings';

export const validateCustomFields = function (fields) {
	// Special Case:
	// If an admin didn't set any custom fields there's nothing to validate against so consider any customFields valid
	if (s.trim(settings.get('Accounts_CustomFields')) === '') {
		return;
	}

	let customFieldsMeta;
	try {
		customFieldsMeta = JSON.parse(settings.get('Accounts_CustomFields'));
	} catch (e) {
		throw new Meteor.Error('error-invalid-customfield-json', 'Invalid JSON for Custom Fields');
	}

	const customFields = {};

	Object.keys(customFieldsMeta).forEach((fieldName) => {
		const field = customFieldsMeta[fieldName];

		customFields[fieldName] = fields[fieldName];
		const fieldValue = s.trim(fields[fieldName]);

		if (field.required && fieldValue === '') {
			throw new Meteor.Error('error-user-registration-custom-field', `Field ${fieldName} is required`, { method: 'registerUser' });
		}

		if (field.type === 'select' && field.options.indexOf(fields[fieldName]) === -1) {
			throw new Meteor.Error('error-user-registration-custom-field', `Value for field ${fieldName} is invalid`, { method: 'registerUser' });
		}

		if (field.maxLength && fieldValue.length > field.maxLength) {
			throw new Meteor.Error('error-user-registration-custom-field', `Max length of field ${fieldName} ${field.maxLength}`, {
				method: 'registerUser',
			});
		}

		if (field.minLength && fieldValue.length > 0 && fieldValue.length < field.minLength) {
			throw new Meteor.Error('error-user-registration-custom-field', `Min length of field ${fieldName} ${field.minLength}`, {
				method: 'registerUser',
			});
		}
	});
};

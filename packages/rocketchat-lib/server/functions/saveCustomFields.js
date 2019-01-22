import { settings } from 'meteor/rocketchat:settings';
import s from 'underscore.string';

export const saveCustomFields = function(userId, formData) {
	if (s.trim(settings.get('Accounts_CustomFields')) !== '') {
		RocketChat.validateCustomFields(formData);
		return RocketChat.saveCustomFieldsWithoutValidation(userId, formData);
	}
};

RocketChat.saveCustomFields = saveCustomFields;

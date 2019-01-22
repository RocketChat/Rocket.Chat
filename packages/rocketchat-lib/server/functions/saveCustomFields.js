import { settings } from 'meteor/rocketchat:settings';
import s from 'underscore.string';

RocketChat.saveCustomFields = function(userId, formData) {
	if (s.trim(settings.get('Accounts_CustomFields')) !== '') {
		RocketChat.validateCustomFields(formData);
		return RocketChat.saveCustomFieldsWithoutValidation(userId, formData);
	}
};

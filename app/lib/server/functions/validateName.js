import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';

export const validateName = function(name) {
	if (settings.get('Accounts_SystemBlockedUsernameList').includes(name.toLowerCase())) {
		throw new Meteor.Error('invalid-name', `${ name } is a reserved name.`);
	}
};

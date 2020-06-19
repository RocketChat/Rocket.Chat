import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Users } from '../../../models/server';
import { settings } from '../../../settings';
import { Notifications } from '../../../notifications';
import { hasPermission } from '../../../authorization';
import { RateLimiter } from '../lib';

export const _setRealName = function(userId, name, fullUser) {
	name = s.trim(name);

	if (!userId || (settings.get('Accounts_RequireNameForSignUp') && !name)) {
		return false;
	}

	const user = fullUser || Users.findOneById(userId);

	// User already has desired name, return
	if (s.trim(user.name) === name) {
		return user;
	}

	// Set new name
	if (name) {
		Users.setName(user._id, name);
	} else {
		Users.unsetName(user._id);
	}
	user.name = name;

	if (settings.get('UI_Use_Real_Name') === true) {
		Notifications.notifyLogged('Users:NameChanged', {
			_id: user._id,
			name: user.name,
			username: user.username,
		});
	}

	return user;
};

export const setRealName = RateLimiter.limitFunction(_setRealName, 1, 60000, {
	0() { return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info'); }, // Administrators have permission to change others names, so don't limit those
});

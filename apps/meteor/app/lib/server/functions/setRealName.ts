import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import type { IUser } from '@rocket.chat/core-typings';

import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { hasPermission } from '../../../authorization/server';
import { RateLimiter } from '../lib';
import { api } from '../../../../server/sdk/api';

export const _setRealName = function (userId: string, name: string, fullUser: IUser): IUser | undefined {
	name = s.trim(name);

	if (!userId || (settings.get('Accounts_RequireNameForSignUp') && !name)) {
		return;
	}

	const user = fullUser || Users.findOneById(userId);

	if (!user) {
		return;
	}

	// User already has desired name, return
	if (user.name && s.trim(user.name) === name) {
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
		api.broadcast('user.nameChanged', {
			_id: user._id,
			name: user.name,
			username: user.username,
		});
	}

	return user;
};

export const setRealName = RateLimiter.limitFunction(_setRealName, 1, 60000, {
	0() {
		const userId = Meteor.userId();
		return !userId || !hasPermission(userId, 'edit-other-user-info');
	}, // Administrators have permission to change others names, so don't limit those
});

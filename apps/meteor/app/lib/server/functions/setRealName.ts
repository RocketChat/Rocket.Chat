import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { RateLimiter } from '../lib';

export const _setRealName = async function (userId: string, name: string, fullUser?: IUser): Promise<IUser | undefined> {
	name = name.trim();

	if (!userId || (settings.get('Accounts_RequireNameForSignUp') && !name)) {
		return;
	}

	const user = fullUser || (await Users.findOneById(userId));

	if (!user) {
		return;
	}

	// User already has desired name, return
	if (user.name && user.name.trim() === name) {
		return user;
	}

	// Set new name
	if (name) {
		await Users.setName(user._id, name);
	} else {
		await Users.unsetName(user._id);
	}
	user.name = name;

	if (settings.get('UI_Use_Real_Name') === true) {
		void api.broadcast('user.nameChanged', {
			_id: user._id,
			name: user.name,
			username: user.username,
		});
	}
	void api.broadcast('user.realNameChanged', {
		_id: user._id,
		name,
		username: user.username,
	});

	return user;
};

export const setRealName = RateLimiter.limitFunction(_setRealName, 1, 60000, {
	async 0() {
		const userId = Meteor.userId();
		return !userId || !(await hasPermissionAsync(userId, 'edit-other-user-info'));
	}, // Administrators have permission to change others names, so don't limit those
});

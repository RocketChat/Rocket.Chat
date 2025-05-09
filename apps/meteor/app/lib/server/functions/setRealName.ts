import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { RateLimiter } from '../lib';

export const _setRealName = async function (
	userId: string,
	name: string,
	fullUser?: IUser,
	updater?: Updater<IUser>,
	session?: ClientSession,
): Promise<IUser | undefined> {
	name = name.trim();

	if (!userId || (settings.get('Accounts_RequireNameForSignUp') && !name)) {
		return;
	}

	const user = fullUser || (await Users.findOneById(userId, { session }));

	if (!user) {
		return;
	}

	// User already has desired name, return
	if (user.name && user.name.trim() === name) {
		return user;
	}

	// Set new name
	if (name) {
		if (updater) {
			updater.set('name', name);
		} else {
			await Users.setName(user._id, name, { session });
		}
	} else if (updater) {
		updater.unset('name');
	} else {
		await Users.unsetName(user._id, { session });
	}
	user.name = name;

	await onceTransactionCommitedSuccessfully(() => {
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
	}, session);

	return user;
};

export const setRealName = RateLimiter.limitFunction(_setRealName, 1, 60000, {
	async 0() {
		const userId = Meteor.userId();
		return !userId || !(await hasPermissionAsync(userId, 'edit-other-user-info'));
	}, // Administrators have permission to change others names, so don't limit those
});

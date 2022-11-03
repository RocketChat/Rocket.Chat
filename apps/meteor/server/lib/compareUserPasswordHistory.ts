import { Accounts } from 'meteor/accounts-base';
import type { IUser, IPassword } from '@rocket.chat/core-typings';

import { settings } from '../../app/settings/server';

/**
 * Check if a given password is the one user by given user or if the user doesn't have a password
 * @param {object} user User object
 * @param {object} pass Object with { plain: 'plain-test-password' } or { sha256: 'sha256password' }
 */
export function compareUserPasswordHistory(user: IUser, pass: IPassword): boolean {
	if (!user?.services?.passwordHistory || !settings.get('Accounts_Password_History_Enabled')) {
		return true;
	}

	if (!pass || (!pass.plain && !pass.sha256) || !user?.services?.password?.bcrypt) {
		return false;
	}

	const currentPassword = user.services.password.bcrypt;
	const passwordHistory = user.services.passwordHistory.slice(-Number(settings.get('Accounts_Password_History_Amount')));

	for (const password of passwordHistory) {
		if (!password.trim()) {
			user.services.password.bcrypt = currentPassword;
			return false;
		}
		user.services.password.bcrypt = password;

		const historyPassword = pass.plain || {
			digest: pass.sha256 ? pass.sha256.toLowerCase() : '',
			algorithm: 'sha-256' as const,
		};

		const passCheck = Accounts._checkPassword(user as Meteor.User, historyPassword);

		if (!passCheck.error) {
			user.services.password.bcrypt = currentPassword;
			return false;
		}
	}

	user.services.password.bcrypt = currentPassword;
	return true;
}

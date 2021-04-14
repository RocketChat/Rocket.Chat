import { Accounts } from 'meteor/accounts-base';

import { IUser } from '../../definition/IUser';
import { IPassword } from '../../definition/IPassword';

/**
 * Check if a given password is the one user by given user or if the user doesn't have a password
 * @param {object} user User object
 * @param {object} pass Object with { plain: 'plain-test-password' } or { sha256: 'sha256password' }
 */
export function compareUserPasswordHistory(user: IUser, pass: IPassword): boolean {
	if (!user?.services?.passwordHistory) {
		return true;
	}

	if (!pass || (!pass.plain && !pass.sha256) || !user?.services?.password?.bcrypt) {
		return false;
	}

	const currentPassword = user.services.password.bcrypt;

	for (const password of user.services.passwordHistory) {
		if (!password.trim()) {
			user.services.password.bcrypt = currentPassword;
			return false;
		}
		user.services.password.bcrypt = password;

		const historyPassword = pass.plain || {
			digest: pass.sha256 ? pass.sha256.toLowerCase() : '',
			algorithm: 'sha-256' as const,
		};

		const passCheck = Accounts._checkPassword(user, historyPassword);

		if (!passCheck.error) {
			user.services.password.bcrypt = currentPassword;
			return false;
		}
	}

	user.services.password.bcrypt = currentPassword;
	return true;
}

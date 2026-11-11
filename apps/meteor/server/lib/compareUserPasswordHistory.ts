import { verifyPassword } from '@rocket.chat/account-utils';
import type { IUser, IPassword } from '@rocket.chat/core-typings';

import { settings } from '../settings';

/**
 * Check if a given password is the one user by given user or if the user doesn't have a password
 * @param {object} user User object
 * @param {object} pass Object with { plain: 'plain-test-password' } or { sha256: 'sha256password' }
 */
export async function compareUserPasswordHistory(user: IUser, pass: IPassword): Promise<boolean> {
	if (!user?.services?.passwordHistory || !settings.get('Accounts_Password_History_Enabled')) {
		return true;
	}

	if (!pass || (!pass.plain && !pass.sha256) || !user?.services?.password?.bcrypt) {
		return false;
	}

	const passwordHistory = user.services.passwordHistory.slice(-Number(settings.get('Accounts_Password_History_Amount')));

	const historyPassword = pass.plain || {
		digest: pass.sha256 || '',
		algorithm: 'sha-256' as const,
	};

	for (const passwordHash of passwordHistory) {
		if (!passwordHash.trim()) {
			return false;
		}

		if (await verifyPassword(historyPassword, passwordHash)) {
			return false;
		}
	}

	return true;
}

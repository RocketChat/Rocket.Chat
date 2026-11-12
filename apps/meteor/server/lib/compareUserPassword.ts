import { verifyPassword } from '@rocket.chat/account-utils';
import type { IUser, IPassword } from '@rocket.chat/core-typings';

/**
 * Check if a given password is the one user by given user or if the user doesn't have a password
 * @param {object} user User object
 * @param {object} pass Object with { plain: 'plain-test-password' } or { sha256: 'sha256password' }
 */
export async function compareUserPassword(user: Pick<IUser, 'services'>, pass: IPassword): Promise<boolean> {
	const passwordHash = user?.services?.password?.bcrypt;
	if (!passwordHash?.trim()) {
		return false;
	}

	if (!pass || (!pass.plain && !pass.sha256)) {
		return false;
	}

	const password = pass.plain || {
		digest: pass.sha256 || '',
		algorithm: 'sha-256' as const,
	};

	return verifyPassword(password, passwordHash);
}

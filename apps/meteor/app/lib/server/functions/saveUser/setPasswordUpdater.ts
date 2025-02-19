import crypto from 'crypto';

import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/model-typings';
import bcrypt from 'bcrypt';
import { Accounts } from 'meteor/accounts-base';

const hashPassword = async (password: string) => {
	const hash = crypto.createHash('sha256');
	hash.update(password);
	const hashedPassword = hash.digest('hex');
	return bcrypt.hash(hashedPassword, Accounts._bcryptRounds());
};

export async function setPasswordUpdater(
	updater: Updater<IUser>,
	newPlaintextPassword: string,
	options: { logout?: boolean } = { logout: true },
) {
	updater.set('services.password.bcrypt', await hashPassword(newPlaintextPassword));

	if (options.logout) {
		updater.unset('services.resume.loginTokens');
	}
}

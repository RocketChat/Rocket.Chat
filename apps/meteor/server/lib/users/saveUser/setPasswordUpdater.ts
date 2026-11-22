import { hashPassword } from '@rocket.chat/account-utils';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/model-typings';

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

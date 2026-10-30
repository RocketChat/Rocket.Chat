import { Apps, AppEvents } from '@rocket.chat/apps';
import { ClientSafeError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { ILoginAttempt } from './ILoginAttempt';
import { isValidAttemptByUser, isValidLoginAttemptByIp } from './restrictLoginAttempts';
import { settings } from '../../settings';
import { callbacks } from '../callbacks';
import { getClientAddress } from '../getClientAddress';

const hasUser = (login: ILoginAttempt): login is ILoginAttempt & { user: IUser } => login.user !== undefined;

/** Applies the workspace's login policy to an attempt made by any login method; throws when the policy refuses it. */
export const validateLoginAttempt = async (attempt: ILoginAttempt): Promise<boolean> => {
	const login = await callbacks.run('beforeValidateLogin', attempt);

	if (!(await isValidLoginAttemptByIp(getClientAddress(login.connection)))) {
		throw new ClientSafeError('error-login-blocked-for-ip', 'Login has been temporarily blocked For IP', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!(await isValidAttemptByUser(login))) {
		throw new ClientSafeError('error-login-blocked-for-user', 'Login has been temporarily blocked For User', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (login.allowed !== true) {
		return login.allowed;
	}

	if (!hasUser(login)) {
		return false;
	}

	if (login.user.type === 'visitor') {
		return true;
	}

	if (login.user.type === 'app') {
		throw new ClientSafeError('error-app-user-is-not-allowed-to-login', 'App user is not allowed to login', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!!login.user.active !== true) {
		throw new ClientSafeError('error-user-is-not-activated', 'User is not activated', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!login.user.roles || !Array.isArray(login.user.roles)) {
		throw new ClientSafeError('error-user-has-no-roles', 'User has no roles', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (
		login.user.roles.includes('admin') === false &&
		(login.type === 'password' || login.type === 'passkey') &&
		settings.get('Accounts_EmailVerification') === true
	) {
		const validEmail = login.user.emails?.filter((email) => email.verified === true) ?? [];
		if (validEmail.length === 0) {
			throw new ClientSafeError('error-invalid-email', 'Invalid email __email__');
		}
	}

	const validated = await callbacks.run('onValidateLogin', login);
	if (!hasUser(validated)) {
		return false;
	}

	await Users.updateLastLoginById(validated.user._id);
	setImmediate(() => {
		return callbacks.run('afterValidateLogin', validated);
	});

	if (validated.type !== 'resume') {
		await Apps.self?.triggerEvent(AppEvents.IPostUserLoggedIn, validated.user);
	}

	return true;
};

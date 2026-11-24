import { Apps, AppEvents } from '@rocket.chat/apps';
import { User, ClientSafeError } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import { getLoginExpirationInDays } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';

import { sendEnrollmentEmail, sendResetPasswordEmail, sendVerificationEmail } from './accountEmails';
import { insertUser } from './insertUser';
import { isValidAttemptByUser, isValidLoginAttemptByIp } from './restrictLoginAttempts';
import { settings } from '../../settings';
import { callbacks } from '../callbacks';
import { getClientAddress } from '../getClientAddress';
import { getMaxLoginTokens } from '../getMaxLoginTokens';
import { getBaseUserFields } from '../utils/functions/getBaseUserFields';

Accounts.config({
	forbidClientAccountCreation: true,
});
/**
 * Accounts calls `_initServerPublications` and holds the `_defaultPublishFields`, without Object.assign its not possible
 * to extend the projection
 *
 * the idea is to send all required fields to the client during login
 * we tried `defaultFieldsSelector` , but it changes all Meteor.userAsync projections which is undesirable
 *
 *
 * we are removing the status here because meteor send 'offline'
 */
Object.assign(Accounts._defaultPublishFields.projection, (({ status, ...rest }) => rest)(getBaseUserFields(true)));

settings.watch('Accounts_LoginExpiration', (value) => {
	Accounts._options.loginExpirationInDays = getLoginExpirationInDays(value);
});

// accounts-password still calls these from its own methods
Accounts.sendResetPasswordEmail = sendResetPasswordEmail;
Accounts.sendVerificationEmail = sendVerificationEmail;
Accounts.sendEnrollmentEmail = sendEnrollmentEmail;

// oxlint-disable-next-line eslint-js/no-restricted-syntax -- Meteor's updateOrCreateUserFromExternalService still creates users through this
Accounts.insertUserDoc = insertUser;

const validateLoginAttemptAsync = async function (login) {
	login = await callbacks.run('beforeValidateLogin', login);

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

	if (login.user.roles.includes('admin') === false && login.type === 'password' && settings.get('Accounts_EmailVerification') === true) {
		const validEmail = login.user.emails.filter((email) => email.verified === true);
		if (validEmail.length === 0) {
			throw new ClientSafeError('error-invalid-email', 'Invalid email __email__');
		}
	}

	login = await callbacks.run('onValidateLogin', login);

	await Users.updateLastLoginById(login.user._id);
	setImmediate(() => {
		return callbacks.run('afterValidateLogin', login);
	});

	/**
	 * Trigger the event only when the
	 * user does login in Rocket.chat
	 */
	if (login.type !== 'resume') {
		// App IPostUserLoggedIn event hook
		await Apps.self?.triggerEvent(AppEvents.IPostUserLoggedIn, login.user);
	}

	return true;
};

Accounts.validateLoginAttempt(function (...args) {
	// Depends on meteor support for Async
	return validateLoginAttemptAsync.call(this, ...args);
});

Accounts.onLogin(async ({ user }) => {
	if (!user || !user.services || !user.services.resume || !user.services.resume.loginTokens || !user._id) {
		return;
	}

	if (user.services.resume.loginTokens.length < getMaxLoginTokens()) {
		return;
	}

	await User.ensureLoginTokensLimit(user._id);
});

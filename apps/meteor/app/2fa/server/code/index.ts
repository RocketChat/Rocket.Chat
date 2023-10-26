import crypto from 'crypto';

import type { IUser, IMethodConnection } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { EmailCheck } from './EmailCheck';
import type { ICodeCheck } from './ICodeCheck';
import { PasswordCheckFallback } from './PasswordCheckFallback';
import { TOTPCheck } from './TOTPCheck';

export interface ITwoFactorOptions {
	disablePasswordFallback?: boolean;
	disableRememberMe?: boolean;
	requireSecondFactor?: boolean; // whether any two factor should be required
}

const totpCheck = new TOTPCheck();
export const emailCheck = new EmailCheck();
const passwordCheckFallback = new PasswordCheckFallback();

const checkMethods = new Map<string, ICodeCheck>();

checkMethods.set(totpCheck.name, totpCheck);
checkMethods.set(emailCheck.name, emailCheck);

function getMethodByNameOrFirstActiveForUser(user: IUser, name?: string): ICodeCheck | undefined {
	if (name && checkMethods.has(name)) {
		return checkMethods.get(name);
	}

	return Array.from(checkMethods.values()).find((method) => method.isEnabled(user));
}

function getAvailableMethodNames(user: IUser): string[] {
	return (
		Array.from(checkMethods)
			.filter(([, method]) => method.isEnabled(user))
			.map(([name]) => name) || []
	);
}

export async function getUserForCheck(userId: string): Promise<IUser | null> {
	return Users.findOneById(userId, {
		projection: {
			'emails': 1,
			'language': 1,
			'createdAt': 1,
			'services.totp': 1,
			'services.email2fa': 1,
			'services.emailCode': 1,
			'services.password': 1,
			'services.resume.loginTokens': 1,
		},
	});
}

function getFingerprintFromConnection(connection: IMethodConnection): string {
	const data = JSON.stringify({
		userAgent: connection.httpHeaders['user-agent'],
		clientAddress: connection.clientAddress,
	});

	return crypto.createHash('md5').update(data).digest('hex');
}

function getRememberDate(from: Date = new Date()): Date | undefined {
	const rememberFor = parseInt(settings.get('Accounts_TwoFactorAuthentication_RememberFor') as string, 10);

	if (rememberFor <= 0) {
		return;
	}

	const expires = new Date(from);
	expires.setSeconds(expires.getSeconds() + rememberFor);

	return expires;
}

function isAuthorizedForToken(connection: IMethodConnection, user: IUser, options: ITwoFactorOptions): boolean {
	const currentToken = Accounts._getLoginToken(connection.id);
	const tokenObject = user.services?.resume?.loginTokens?.find((i) => i.hashedToken === currentToken);

	if (!tokenObject) {
		return false;
	}

	// if any two factor is required, early abort
	if (options.requireSecondFactor) {
		return false;
	}

	if ('bypassTwoFactor' in tokenObject && tokenObject.bypassTwoFactor === true) {
		return true;
	}

	if (options.disableRememberMe === true) {
		return false;
	}

	// remember user right after their registration
	const rememberAfterRegistration = user.createdAt && getRememberDate(user.createdAt);
	if (rememberAfterRegistration && rememberAfterRegistration >= new Date()) {
		return true;
	}

	if (!tokenObject.twoFactorAuthorizedUntil || !tokenObject.twoFactorAuthorizedHash) {
		return false;
	}

	if (tokenObject.twoFactorAuthorizedUntil < new Date()) {
		return false;
	}

	if (tokenObject.twoFactorAuthorizedHash !== getFingerprintFromConnection(connection)) {
		return false;
	}

	return true;
}

async function rememberAuthorization(connection: IMethodConnection, user: IUser): Promise<void> {
	const currentToken = Accounts._getLoginToken(connection.id);

	const expires = getRememberDate();
	if (!expires) {
		return;
	}

	if (!currentToken) {
		return;
	}

	await Users.setTwoFactorAuthorizationHashAndUntilForUserIdAndToken(
		user._id,
		currentToken,
		getFingerprintFromConnection(connection),
		expires,
	);
}

interface ICheckCodeForUser {
	user: IUser | string;
	code?: string;
	method?: string;
	options?: ITwoFactorOptions;
	connection?: IMethodConnection;
}

const getSecondFactorMethod = (user: IUser, method: string | undefined, options: ITwoFactorOptions): ICodeCheck | undefined => {
	// try first getting one of the available methods or the one that was already provided
	const selectedMethod = getMethodByNameOrFirstActiveForUser(user, method);
	if (selectedMethod) {
		return selectedMethod;
	}

	// if none found but a second factor is required, chose the password check
	if (options.requireSecondFactor) {
		return passwordCheckFallback;
	}

	// check if password fallback is enabled
	if (!options.disablePasswordFallback && passwordCheckFallback.isEnabled(user, !!options.requireSecondFactor)) {
		return passwordCheckFallback;
	}
};

export async function checkCodeForUser({ user, code, method, options = {}, connection }: ICheckCodeForUser): Promise<boolean> {
	if (process.env.TEST_MODE && !options.requireSecondFactor) {
		return true;
	}

	if (!settings.get('Accounts_TwoFactorAuthentication_Enabled')) {
		return true;
	}

	let existingUser: IUser | null;

	if (typeof user === 'string') {
		existingUser = await getUserForCheck(user);
	} else {
		existingUser = user;
	}

	if (!existingUser) {
		throw new Meteor.Error('totp-user-not-found', 'TOTP User not found');
	}

	if (!code && !method && connection?.httpHeaders?.['x-2fa-code'] && connection.httpHeaders['x-2fa-method']) {
		code = connection.httpHeaders['x-2fa-code'];
		method = connection.httpHeaders['x-2fa-method'];
	}

	if (connection && isAuthorizedForToken(connection, existingUser, options)) {
		return true;
	}

	// select a second factor method or return if none is found/available
	const selectedMethod = getSecondFactorMethod(existingUser, method, options);
	if (!selectedMethod) {
		return true;
	}

	const data = await selectedMethod.processInvalidCode(existingUser);

	const availableMethods = getAvailableMethodNames(existingUser);

	if (!code) {
		throw new Meteor.Error('totp-required', 'TOTP Required', {
			method: selectedMethod.name,
			...data,
			availableMethods,
		});
	}

	const valid = await selectedMethod.verify(existingUser, code, options.requireSecondFactor);
	if (!valid) {
		throw new Meteor.Error('totp-invalid', 'TOTP Invalid', {
			method: selectedMethod.name,
			...data,
			availableMethods,
		});
	}

	if (options.disableRememberMe !== true && connection) {
		await rememberAuthorization(connection, existingUser);
	}

	return true;
}

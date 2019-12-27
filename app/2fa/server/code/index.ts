import crypto from 'crypto';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../../settings/server';
import { TOTPCheck } from './TOTPCheck';
import { EmailCheck } from './EmailCheck';
import { PasswordCheckFallback } from './PasswordCheckFallback';
import { IUser } from '../../../../definition/IUser';
import { ICodeCheck } from './ICodeCheck';
import { Users } from '../../../models/server';
import { IMethodConnection } from '../../../../definition/IMethodThisType';

interface IMethods {
	[key: string]: ICodeCheck;
}

export interface ITwoFactorOptions {
	disablePasswordFallback?: boolean;
	disableRememberMe?: boolean;
}

export const totpCheck = new TOTPCheck();
export const emailCheck = new EmailCheck();
export const passwordCheckFallback = new PasswordCheckFallback();

export const checkMethods: IMethods = {
	totp: totpCheck,
	email: emailCheck,
};

export function getMethodByNameOrFirstActiveForUser(user: IUser, name?: string): [string, ICodeCheck] | [] {
	if (name && name in checkMethods) {
		return [name, checkMethods[name]];
	}

	return Object.entries(checkMethods).find(([, method]) => method.isEnabled(user)) || [];
}

export function getAvailableMethodNames(user: IUser): string[] | [] {
	return Object.entries(checkMethods).filter(([, method]) => method.isEnabled(user)).map(([name]) => name) || [];
}

export function getUserForCheck(userId: string): IUser {
	return Users.findOneById(userId, {
		fields: {
			emails: 1,
			language: 1,
			'services.totp': 1,
			'services.email2fa': 1,
			'services.emailCode': 1,
			'services.password': 1,
			'services.resume.loginTokens': 1,
		},
	});
}

export function getFingerprintFromConnection(connection: IMethodConnection): string {
	const data = JSON.stringify({
		userAgent: connection.httpHeaders['user-agent'],
		clientAddress: connection.clientAddress,
	});

	return crypto.createHash('md5').update(data).digest('hex');
}

export function isAuthorizedForToken(connection: IMethodConnection, user: IUser, options: ITwoFactorOptions): boolean {
	const currentToken = Accounts._getLoginToken(connection.id);
	const tokenObject = user.services?.resume?.loginTokens?.find((i) => i.hashedToken === currentToken);

	if (!tokenObject) {
		return false;
	}

	if (tokenObject.bypassTwoFactor === true) {
		return true;
	}

	if (options.disableRememberMe === true) {
		return false;
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

export function rememberAuthorization(connection: IMethodConnection, user: IUser): void {
	const currentToken = Accounts._getLoginToken(connection.id);

	const rememberFor = parseInt(settings.get('Accounts_TwoFactorAuthentication_RememberFor'));

	if (rememberFor <= 0) {
		return;
	}

	const expires = new Date();
	expires.setSeconds(expires.getSeconds() + rememberFor);

	Users.setTwoFactorAuthorizationHashAndUntilForUserIdAndToken(user._id, currentToken, getFingerprintFromConnection(connection), expires);
}

export function checkCodeForUser({ user, code, method, options = {}, connection }: { user: IUser | string; code?: string; method?: string; options?: ITwoFactorOptions; connection?: IMethodConnection }): boolean {
	if (typeof user === 'string') {
		user = getUserForCheck(user);
	}

	if (connection && isAuthorizedForToken(connection, user, options)) {
		return true;
	}

	let [methodName, selectedMethod] = getMethodByNameOrFirstActiveForUser(user, method);

	if (!selectedMethod) {
		if (options.disablePasswordFallback || !passwordCheckFallback.isEnabled(user)) {
			return true;
		}
		selectedMethod = passwordCheckFallback;
		methodName = 'password';
	}

	if (!code) {
		const data = selectedMethod.processInvalidCode(user);
		const availableMethods = getAvailableMethodNames(user);

		throw new Meteor.Error('totp-required', 'TOTP Required', { method: methodName, ...data, availableMethods });
	}

	const valid = selectedMethod.verify(user, code);

	if (!valid) {
		throw new Meteor.Error('totp-invalid', 'TOTP Invalid', { method: methodName });
	}

	if (options.disableRememberMe !== true && connection) {
		rememberAuthorization(connection, user);
	}

	return true;
}

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

export interface ITwoFactorOptions {
	disablePasswordFallback?: boolean;
	disableRememberMe?: boolean;
}

export const totpCheck = new TOTPCheck();
export const emailCheck = new EmailCheck();
export const passwordCheckFallback = new PasswordCheckFallback();

export const checkMethods = new Map<string, ICodeCheck>();

checkMethods.set(totpCheck.name, totpCheck);
checkMethods.set(emailCheck.name, emailCheck);

export function getMethodByNameOrFirstActiveForUser(user: IUser, name?: string): ICodeCheck | undefined {
	if (name && checkMethods.has(name)) {
		return checkMethods.get(name);
	}

	return Array.from(checkMethods.values()).find((method) => method.isEnabled(user));
}

export function getAvailableMethodNames(user: IUser): string[] | [] {
	return Array.from(checkMethods).filter(([, method]) => method.isEnabled(user)).map(([name]) => name) || [];
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

	const rememberFor = parseInt(settings.get('Accounts_TwoFactorAuthentication_RememberFor') as string, 10);

	if (rememberFor <= 0) {
		return;
	}

	const expires = new Date();
	expires.setSeconds(expires.getSeconds() + rememberFor);

	Users.setTwoFactorAuthorizationHashAndUntilForUserIdAndToken(user._id, currentToken, getFingerprintFromConnection(connection), expires);
}

interface ICheckCodeForUser {
	user: IUser | string;
	code?: string;
	method?: string;
	options?: ITwoFactorOptions;
	connection?: IMethodConnection;
}

function _checkCodeForUser({ user, code, method, options = {}, connection }: ICheckCodeForUser): boolean {
	if (typeof user === 'string') {
		user = getUserForCheck(user);
	}

	if (!code && !method && connection?.httpHeaders?.['x-2fa-code'] && connection.httpHeaders['x-2fa-method']) {
		code = connection.httpHeaders['x-2fa-code'];
		method = connection.httpHeaders['x-2fa-method'];
	}

	if (connection && isAuthorizedForToken(connection, user, options)) {
		return true;
	}

	let selectedMethod = getMethodByNameOrFirstActiveForUser(user, method);

	if (!selectedMethod) {
		if (options.disablePasswordFallback || !passwordCheckFallback.isEnabled(user)) {
			return true;
		}
		selectedMethod = passwordCheckFallback;
	}

	if (!code) {
		const data = selectedMethod.processInvalidCode(user);
		const availableMethods = getAvailableMethodNames(user);

		throw new Meteor.Error('totp-required', 'TOTP Required', { method: selectedMethod.name, ...data, availableMethods });
	}

	const valid = selectedMethod.verify(user, code);

	if (!valid) {
		throw new Meteor.Error('totp-invalid', 'TOTP Invalid', { method: selectedMethod.name });
	}

	if (options.disableRememberMe !== true && connection) {
		rememberAuthorization(connection, user);
	}

	return true;
}

export const checkCodeForUser = process.env.TEST_MODE ? (): boolean => true : _checkCodeForUser;

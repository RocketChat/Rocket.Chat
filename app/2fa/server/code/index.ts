import { Meteor } from 'meteor/meteor';

import { TOTPCheck } from './TOTPCheck';
import { EmailCheck } from './EmailCheck';
import { PasswordCheckFallback } from './PasswordCheckFallback';
import { IUser } from '../../../../definition/IUser';
import { ICodeCheck } from './ICodeCheck';
import { Users } from '../../../models/server';

interface IMethods {
	[key: string]: ICodeCheck;
}

export interface ITwoFactorOptions {
	disablePasswordFallback?: boolean;
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
		},
	});
}

export function checkCodeForUser({ user, code, method, options = {} }: { user: IUser | string; code?: string; method?: string; options?: ITwoFactorOptions }): boolean {
	if (typeof user === 'string') {
		user = getUserForCheck(user);
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

	return true;
}

import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { TOTPCheck } from './TOTPCheck';
import { EmailCheck } from './EmailCheck';
import { IUser } from '../../../../definition/IUser';
import { ICodeCheck } from './ICodeCheck';
import { Users } from '../../../models/server';

interface IMethods {
	[key: string]: ICodeCheck;
}

export const totpCheck = new TOTPCheck();
export const emailCheck = new EmailCheck();

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

export function getUserForCheck(userId: string): IUser {
	return Users.findOneById(userId, {
		fields: {
			emails: 1,
			'services.totp': 1,
			'services.emailCode': 1,
		},
	});
}

export function checkCodeForUser(user: IUser | string, code: string): boolean {
	if (!settings.get('Accounts_TwoFactorAuthentication_Enabled')) {
		return true;
	}

	if (typeof user === 'string') {
		user = getUserForCheck(user);
	}

	const [methodName, method] = getMethodByNameOrFirstActiveForUser(user);

	if (!method) {
		return true;
	}

	if (!code) {
		method.processInvalidCode(user, code);

		throw new Meteor.Error('totp-required', 'TOTP Required', methodName);
	}

	const valid = method.verify(user, code);

	if (!valid) {
		throw new Meteor.Error('totp-invalid', 'TOTP Invalid', methodName);
	}

	return true;
}

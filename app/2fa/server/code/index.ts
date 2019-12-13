import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { TOTPCheck } from './TOTPCheck';
import { EmailCheck } from './EmailCheck';
import { IUser } from '../../../../definition/IUser';
import { ICodeCheck } from './ICodeCheck';

interface IMethods {
	[key: string]: ICodeCheck;
}

const methods: IMethods = {
	totp: new TOTPCheck(),
	email: new EmailCheck(),
};

export function getMethodByNameOrFirstActiveForUser(user: IUser, name?: string): [string, ICodeCheck] | [] {
	if (name && name in methods) {
		return [name, methods[name]];
	}

	return Object.entries(methods).find(([, method]) => method.isEnabled(user)) || [];
}

export function checkCodeForUser(user: IUser, code: string): boolean {
	if (!settings.get('Accounts_TwoFactorAuthentication_Enabled')) {
		return true;
	}

	const [methodName, method] = getMethodByNameOrFirstActiveForUser(user);

	if (!method) {
		return true;
	}
	console.log(methodName);

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

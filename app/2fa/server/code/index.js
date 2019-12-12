import { Meteor } from 'meteor/meteor';

import totp from './totp';
import email from './email';
import { settings } from '../../../settings';

const methods = {
	totp,
	email,
};

export function getMethodByNameOrFirstActiveForUser(user, name) {
	if (name && name in methods) {
		return methods[name];
	}

	return Object.entries(methods).find(([, method]) => method.isEnabled(user));
}

export function checkCodeForUser(user, code) {
	if (!settings.get('Accounts_TwoFactorAuthentication_Enabled')) {
		return true;
	}

	const [methodName, method] = getMethodByNameOrFirstActiveForUser(user);
	console.log(methodName);

	if (!code) {
		method.processInvalidCode(user, code);

		throw new Meteor.Error('totp-required', 'TOTP Required', methodName);
	}

	const valid = method.verify(user, code);

	if (!valid) {
		throw new Meteor.Error('totp-invalid', 'TOTP Invalid', methodName);
	}
}

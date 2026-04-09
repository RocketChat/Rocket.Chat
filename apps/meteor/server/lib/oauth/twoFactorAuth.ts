import type { IUser } from '@rocket.chat/core-typings';

import { getRememberDate } from '../../../app/2fa/server/code';
import { EmailCheckForOAuth } from '../../../app/2fa/server/code/EmailCheckForOAuth';

const emailCheckForOAuth = new EmailCheckForOAuth();

export const twoFACheckMethodsForOAuth = {
	[emailCheckForOAuth.name]: emailCheckForOAuth,
};

const getSecondFactorMethod = (user: IUser) => {
	return Array.from(Object.values(twoFACheckMethodsForOAuth)).find((method) => method.isEnabled(user));
};

export const doesUserRquire2FA = (user: IUser) => {
	const rememberAfterRegistration = getRememberDate(user.createdAt);

	console.log('rememberAfterRegistration - ', rememberAfterRegistration);

	if (rememberAfterRegistration && rememberAfterRegistration > new Date()) {
		console.log('remembering after registration');
		console.log('time difference - ', rememberAfterRegistration.getTime() - new Date().getTime());
		return false;
	}

	const secondFactorMethod = getSecondFactorMethod(user);

	if (!secondFactorMethod) {
		return false;
	}

	return secondFactorMethod;
};

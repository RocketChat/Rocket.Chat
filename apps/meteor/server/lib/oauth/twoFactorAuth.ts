import type { IUser } from '@rocket.chat/core-typings';

import { getRememberDate } from '../2fa/code';
import { EmailCheckForOAuth } from '../2fa/code/EmailCheckForOAuth';
import { TOTPCheckForOAuth } from '../2fa/code/TOTPCheckForOAuth';

export const emailCheckForOAuth = new EmailCheckForOAuth();
export const totpCheckForOAuth = new TOTPCheckForOAuth();

const twoFACheckMethodsForOAuth = {
	[emailCheckForOAuth.method]: emailCheckForOAuth,
	[totpCheckForOAuth.method]: totpCheckForOAuth,
};

export const getTwoFAMethodForOAuth = (method: 'email' | 'totp') => {
	return twoFACheckMethodsForOAuth[method];
};

const getSecondFactorMethod = (user: IUser) => {
	return Array.from(Object.values(twoFACheckMethodsForOAuth)).find((method) => method.isEnabled(user));
};

export const doesUserRequire2FA = (user: IUser) => {
	const rememberAfterRegistration = getRememberDate(user.createdAt);

	if (rememberAfterRegistration && rememberAfterRegistration > new Date()) {
		return false;
	}

	const secondFactorMethod = getSecondFactorMethod(user);

	if (!secondFactorMethod) {
		return false;
	}

	return secondFactorMethod;
};

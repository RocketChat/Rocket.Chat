import type { IUser } from '@rocket.chat/core-typings';

import { getRememberDate } from '../../../app/2fa/server/code';
import { EmailCheckForOAuth } from '../../../app/2fa/server/code/EmailCheckForOAuth';
import { TOTPCheckForOAuth } from '../../../app/2fa/server/code/TOTPCheckForOAuth';

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

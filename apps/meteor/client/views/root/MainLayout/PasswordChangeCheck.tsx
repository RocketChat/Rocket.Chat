import type { IUser } from '@rocket.chat/core-typings';
import { useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { lazy } from 'react';

import TwoFactorAuthSetupCheck from './TwoFactorAuthSetupCheck';

const ResetPasswordPage = lazy(() =>
	import('@rocket.chat/web-ui-registration').then(({ ResetPasswordPage }) => ({ default: ResetPasswordPage })),
);

const PasswordChangeCheck = ({ children }: { children: ReactNode }): ReactElement => {
	const requirePasswordChange = (useUser() as IUser | null)?.requirePasswordChange === true;

	if (requirePasswordChange) {
		return <ResetPasswordPage />;
	}

	return <TwoFactorAuthSetupCheck>{children}</TwoFactorAuthSetupCheck>;
};

export default PasswordChangeCheck;

import React, { lazy, ReactElement, ReactNode } from 'react';

import { IUser } from '../../../../definition/IUser';
import { useUser } from '../../../contexts/UserContext';
import TwoFactorAuthSetupCheck from './TwoFactorAuthSetupCheck';

const ResetPasswordPage = lazy(() => import('../../login/ResetPassword/ResetPassword'));

const PasswordChangeCheck = ({ children }: { children: ReactNode }): ReactElement => {
	const requirePasswordChange = (useUser() as IUser | null)?.requirePasswordChange === true;

	if (requirePasswordChange) {
		return <ResetPasswordPage />;
	}

	return <TwoFactorAuthSetupCheck>{children}</TwoFactorAuthSetupCheck>;
};

export default PasswordChangeCheck;

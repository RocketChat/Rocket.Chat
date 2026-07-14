import { useUser } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { lazy } from 'react';

import TwoFactorAuthSetupCheck from './TwoFactorAuthSetupCheck';

const ResetPasswordPage = lazy(() =>
	import('@rocket.chat/web-ui-registration').then(({ ResetPasswordPage }) => ({ default: ResetPasswordPage })),
);

export type PasswordChangeCheckProps = { children: ReactNode };

const PasswordChangeCheck = ({ children }: PasswordChangeCheckProps) => {
	const requirePasswordChange = useUser()?.requirePasswordChange === true;

	if (requirePasswordChange) {
		return <ResetPasswordPage />;
	}

	return <TwoFactorAuthSetupCheck>{children}</TwoFactorAuthSetupCheck>;
};

export default PasswordChangeCheck;

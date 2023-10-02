import type { IUser } from '@rocket.chat/core-typings';
import { useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useEmailVerificationWarning(user: IUser | undefined) {
	const emailVerificationEnabled = useSetting<boolean>('Accounts_EmailVerification') === true;
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const mainEmail = user?.emails?.[0];
	const warnedRef = useRef(false);

	useEffect(() => {
		const { current: warned } = warnedRef;
		if (mainEmail && mainEmail.verified !== true && emailVerificationEnabled && !warned) {
			dispatchToastMessage({
				type: 'warning',
				message: t('core.You_have_not_verified_your_email'),
			});
			warnedRef.current = true;
		}
	}, [mainEmail, emailVerificationEnabled, dispatchToastMessage, t]);
}

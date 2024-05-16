import { NavBarItem } from '@rocket.chat/fuselage';
import { useSessionDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

export const NavBarItemLoginPage = (props: Omit<HTMLAttributes<HTMLElement>, 'is'>) => {
	const setForceLogin = useSessionDispatch('forceLogin');
	const t = useTranslation();

	return <NavBarItem primary icon='login' title={t('Sign_in_to_start_talking')} onClick={(): void => setForceLogin(true)} {...props} />;
};

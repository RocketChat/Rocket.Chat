import { Button } from '@rocket.chat/fuselage';
import { useSessionDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

export const NavBarItemLoginPage = (props: Omit<HTMLAttributes<HTMLElement>, 'is'>) => {
	const setForceLogin = useSessionDispatch('forceLogin');
	const t = useTranslation();

	return (
		<Button primary small icon='login' onClick={(): void => setForceLogin(true)} {...props}>
			{t('Login')}
		</Button>
	);
};

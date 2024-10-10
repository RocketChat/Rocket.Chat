import { Button } from '@rocket.chat/fuselage';
import { useSessionDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type NavBarItemLoginPageProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemLoginPage = (props: NavBarItemLoginPageProps) => {
	const setForceLogin = useSessionDispatch('forceLogin');
	const t = useTranslation();

	return (
		<Button primary small icon='login' onClick={(): void => setForceLogin(true)} {...props}>
			{t('Login')}
		</Button>
	);
};

export default NavBarItemLoginPage;

import { Sidebar } from '@rocket.chat/fuselage';
import { useSessionDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

const Login: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const setForceLogin = useSessionDispatch('forceLogin');
	const t = useTranslation();

	return (
		<Sidebar.TopBar.Action
			{...props}
			primary
			icon='login'
			title={t('Sign_in_to_start_talking')}
			onClick={(): void => setForceLogin(true)}
		/>
	);
};

export default Login;

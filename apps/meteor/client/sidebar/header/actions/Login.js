import { Sidebar } from '@rocket.chat/fuselage';
import { useSessionDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const Login = (props) => {
	const setForceLogin = useSessionDispatch('forceLogin');
	const t = useTranslation();

	return (
		<Sidebar.TopBar.Action
			{...props}
			primary
			ghost={false}
			icon='login'
			title={t('Sign_in_to_start_talking')}
			onClick={() => setForceLogin(true)}
		/>
	);
};

export default Login;

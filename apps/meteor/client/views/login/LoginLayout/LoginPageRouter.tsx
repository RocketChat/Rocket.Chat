import { useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { LoginForm } from './LoginForm';
import LoginRegisterForm from './LoginRegisterForm';
import LoginResetPasswordForm from './LoginResetPasswordForm';
import RegistrationI18nProvider from './contexts/RegistrationI18nProvider';
import { useLoginRouter } from './hooks/useLoginRouter';
import { RegistrationPage } from './template/RegistrationPage';

export const LoginPage = (): ReactElement => {
	const [route, setLoginRoute] = useLoginRouter('login');
	const showFormLogin = useSetting('Accounts_ShowFormLogin');

	return (
		<RegistrationI18nProvider>
			<RegistrationPage>
				{route === 'login' && showFormLogin && <LoginForm setLoginRoute={setLoginRoute} />}
				{route === 'reset-password' && <LoginResetPasswordForm setLoginRoute={setLoginRoute} />}
				{route === 'register' && <LoginRegisterForm setLoginRoute={setLoginRoute} />}
			</RegistrationPage>
		</RegistrationI18nProvider>
	);
};

export default LoginPage;

import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { LoginForm } from './LoginForm';
import ResetPasswordForm from './ResetPasswordForm';
import { useLoginRouter } from './hooks/useLoginRouter';
import HorizontalTemplate from './template/HorizontalTemplate';
import SecretRegisterInvalidForm from './SecretRegisterInvalidForm';
import RegisterSecretPageRouter from './RegisterSecretPageRouter';
import LoginRegisterForm from './RegisterForm';

export const RegistrationPageRouter = ({
	defaultRoute = 'login',
}: {
	defaultRoute?: 'login' | 'register' | 'reset-password' | 'secret-register';
}): ReactElement => {
	const [route, setLoginRoute] = useLoginRouter(defaultRoute);
	const showFormLogin = useSetting('Accounts_ShowFormLogin');

	if (route === 'register-invalid') {
		return <SecretRegisterInvalidForm />;
	}

	return (
		<HorizontalTemplate>
			{route === 'login' && showFormLogin && <LoginForm setLoginRoute={setLoginRoute} />}
			{route === 'reset-password' && <ResetPasswordForm setLoginRoute={setLoginRoute} />}
			{(route === 'secret-register' || route === 'register') && <RegisterSecretPageRouter origin={route} setLoginRoute={setLoginRoute} />}
		</HorizontalTemplate>
	);
};

export default RegistrationPageRouter;

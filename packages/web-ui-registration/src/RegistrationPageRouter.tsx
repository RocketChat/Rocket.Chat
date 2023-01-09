import type { ReactElement } from 'react';

import { LoginForm } from './LoginForm';
import ResetPasswordForm from './ResetPasswordForm';
import { useLoginRouter } from './hooks/useLoginRouter';
import HorizontalTemplate from './template/HorizontalTemplate';
import RegisterSecretPageRouter from './RegisterSecretPageRouter';

export const RegistrationPageRouter = ({
	defaultRoute = 'login',
}: {
	defaultRoute?: 'login' | 'register' | 'reset-password' | 'secret-register';
}): ReactElement | null => {
	const [route, setLoginRoute] = useLoginRouter(defaultRoute);

	if (route === 'login') {
		return (
			<HorizontalTemplate>
				<LoginForm setLoginRoute={setLoginRoute} />
			</HorizontalTemplate>
		);
	}

	if (route === 'reset-password') {
		return (
			<HorizontalTemplate>
				<ResetPasswordForm setLoginRoute={setLoginRoute} />
			</HorizontalTemplate>
		);
	}

	if (route === 'secret-register' || route === 'register') {
		return <RegisterSecretPageRouter origin={route} setLoginRoute={setLoginRoute} />;
	}
	return null;
};

export default RegistrationPageRouter;

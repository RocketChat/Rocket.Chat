import type { ReactElement } from 'react';

import { LoginForm } from './LoginForm';
import ResetPasswordForm from './ResetPasswordForm';
import { useLoginRouter } from './hooks/useLoginRouter';
import RegisterSecretPageRouter from './RegisterSecretPageRouter';
import RegisterTemplate from './RegisterTemplate';

export const RegistrationPageRouter = ({
	defaultRoute = 'login',
}: {
	defaultRoute?: 'login' | 'register' | 'reset-password' | 'secret-register';
}): ReactElement | null => {
	const [route, setLoginRoute] = useLoginRouter(defaultRoute);

	if (route === 'login') {
		return (
			<RegisterTemplate>
				<LoginForm setLoginRoute={setLoginRoute} />
			</RegisterTemplate>
		);
	}

	if (route === 'reset-password') {
		return (
			<RegisterTemplate>
				<ResetPasswordForm setLoginRoute={setLoginRoute} />
			</RegisterTemplate>
		);
	}

	if (route === 'secret-register' || route === 'register') {
		return <RegisterSecretPageRouter origin={route} setLoginRoute={setLoginRoute} />;
	}
	return null;
};

export default RegistrationPageRouter;

import type { ReactElement } from 'react';
import { useCurrentRoute } from '@rocket.chat/ui-contexts';

import { LoginForm } from './LoginForm';
import ResetPasswordForm from './ResetPasswordForm';
import { useLoginRouter } from './hooks/useLoginRouter';
import RegisterSecretPageRouter from './RegisterSecretPageRouter';
import RegisterTemplate from './RegisterTemplate';
import GuestForm from './GuestForm';

export const RegistrationPageRouter = ({
	defaultRoute = 'login',
}: {
	defaultRoute?: 'login' | 'register' | 'reset-password' | 'secret-register';
}): ReactElement | null => {
	const [route, setLoginRoute] = useLoginRouter(defaultRoute);
	const [, params] = useCurrentRoute();

	if (route === 'login' && params?.context === 'conference') {
		return (
			<RegisterTemplate>
				<GuestForm />
			</RegisterTemplate>
		);
	}

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

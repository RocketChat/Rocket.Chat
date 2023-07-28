import type { ReactElement, ReactNode } from 'react';

import GuestForm from './GuestForm';
import { LoginForm } from './LoginForm';
import RegisterSecretPageRouter from './RegisterSecretPageRouter';
import RegisterTemplate from './RegisterTemplate';
import ResetPasswordForm from './ResetPasswordForm';
import { useLoginRouter } from './hooks/useLoginRouter';
import type { LoginRoutes } from './hooks/useLoginRouter';

export const RegistrationPageRouter = ({
	defaultRoute = 'login',
	children,
}: {
	defaultRoute?: LoginRoutes;
	children?: ReactNode;
}): ReactElement | null => {
	const [route, setLoginRoute] = useLoginRouter(defaultRoute);

	if (route === 'guest') {
		return (
			<RegisterTemplate>
				<GuestForm setLoginRoute={setLoginRoute} />
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

	if (route === 'anonymous') {
		return <>{children}</>;
	}

	return null;
};

export default RegistrationPageRouter;

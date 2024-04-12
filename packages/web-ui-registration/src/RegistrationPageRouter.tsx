import { useSession } from '@rocket.chat/ui-contexts';
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
	const defaultRouteSession = useSession('loginDefaultState') as LoginRoutes | undefined;
	const [route, setLoginRoute] = useLoginRouter(defaultRouteSession || defaultRoute);

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

	if (route === 'secret-register' || route === 'register' || route === 'invite-register') {
		return <RegisterSecretPageRouter origin={route} setLoginRoute={setLoginRoute} />;
	}

	if (route === 'anonymous') {
		return <>{children}</>;
	}

	return null;
};

export default RegistrationPageRouter;

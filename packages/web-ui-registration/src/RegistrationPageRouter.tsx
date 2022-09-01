import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { LoginForm } from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetPasswordForm from './ResetPasswordForm';
import { useLoginRouter } from './hooks/useLoginRouter';
import RegistrationTemplate from './template/RegistrationTemplate';

export const RegistrationPageRouter = (): ReactElement => {
	const [route, setLoginRoute] = useLoginRouter('login');
	const showFormLogin = useSetting('Accounts_ShowFormLogin');

	return (
		<RegistrationTemplate>
			{route === 'login' && showFormLogin && <LoginForm setLoginRoute={setLoginRoute} />}
			{route === 'reset-password' && <ResetPasswordForm setLoginRoute={setLoginRoute} />}
			{route === 'register' && <RegisterForm setLoginRoute={setLoginRoute} />}
		</RegistrationTemplate>
	);
};

export default RegistrationPageRouter;

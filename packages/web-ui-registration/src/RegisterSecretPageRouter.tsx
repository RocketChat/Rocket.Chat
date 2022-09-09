import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import LoginRegisterForm from './RegisterForm';
import RegisterFormDisabled from './RegisterFormDisabled';
import SecretRegisterForm from './SecretRegisterForm';
import FormSkeleton from './template/FormSkeleton';

export const RegisterSecretPageRouter = ({
	setLoginRoute,
	origin,
}: {
	setLoginRoute: DispatchLoginRouter;
	origin: 'register' | 'secret-register';
}): ReactElement => {
	const registrationMode = useSetting('Accounts_RegistrationForm');
	const isRegistrationDisabled = registrationMode === 'Disabled';
	const isRegistrationAllowedForSecret = registrationMode === 'Secret URL';

	useEffect(() => {
		origin === 'secret-register' && !isRegistrationAllowedForSecret && setLoginRoute('register-invalid');
	}, [origin, isRegistrationAllowedForSecret, setLoginRoute]);

	if (registrationMode === undefined || (origin === 'secret-register' && !isRegistrationAllowedForSecret)) {
		return <FormSkeleton />;
	}

	if (isRegistrationDisabled) {
		return <RegisterFormDisabled setLoginRoute={setLoginRoute} />;
	}

	if (isRegistrationAllowedForSecret) {
		return <SecretRegisterForm setLoginRoute={setLoginRoute} />;
	}

	return <LoginRegisterForm setLoginRoute={setLoginRoute} />;
};

export default RegisterSecretPageRouter;

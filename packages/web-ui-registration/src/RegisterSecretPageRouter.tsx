import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import RegisterForm from './RegisterForm';
import RegisterFormDisabled from './RegisterFormDisabled';
import RegisterTemplate from './RegisterTemplate';
import SecretRegisterForm from './SecretRegisterForm';
import SecretRegisterInvalidForm from './SecretRegisterInvalidForm';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import FormSkeleton from './template/FormSkeleton';

export const RegisterSecretPageRouter = ({
	setLoginRoute,
	origin,
}: {
	setLoginRoute: DispatchLoginRouter;
	origin: 'register' | 'secret-register';
}): ReactElement => {
	const registrationMode = useSetting<string>('Accounts_RegistrationForm');

	const isPublicRegistration = registrationMode === 'Public';
	const isRegistrationAllowedForSecret = registrationMode === 'Secret URL';
	const isRegistrationDisabled = registrationMode === 'Disabled' || (origin === 'register' && isRegistrationAllowedForSecret);

	if (origin === 'secret-register' && !isRegistrationAllowedForSecret) {
		return <SecretRegisterInvalidForm />;
	}

	if (isPublicRegistration) {
		return (
			<RegisterTemplate>
				<RegisterForm setLoginRoute={setLoginRoute} />
			</RegisterTemplate>
		);
	}

	if (isRegistrationDisabled) {
		return (
			<RegisterTemplate>
				<RegisterFormDisabled setLoginRoute={setLoginRoute} />
			</RegisterTemplate>
		);
	}

	if (isRegistrationAllowedForSecret) {
		return <SecretRegisterForm setLoginRoute={setLoginRoute} />;
	}

	return (
		<RegisterTemplate>
			<FormSkeleton />
		</RegisterTemplate>
	);
};

export default RegisterSecretPageRouter;

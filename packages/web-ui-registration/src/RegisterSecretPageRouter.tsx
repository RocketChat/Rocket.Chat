import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import LoginRegisterForm from './RegisterForm';
import RegisterFormDisabled from './RegisterFormDisabled';
import SecretRegisterForm from './SecretRegisterForm';
import SecretRegisterInvalidForm from './SecretRegisterInvalidForm';
import FormSkeleton from './template/FormSkeleton';
import HorizontalTemplate from './template/HorizontalTemplate';

export const RegisterSecretPageRouter = ({
	setLoginRoute,
	origin,
}: {
	setLoginRoute: DispatchLoginRouter;
	origin: 'register' | 'secret-register';
}): ReactElement => {
	const registrationMode = useSetting('Accounts_RegistrationForm');
	const isPublicRegistration = registrationMode === 'Public';
	const isRegistrationAllowedForSecret = registrationMode === 'Secret URL';
	const isRegistrationDisabled = registrationMode === 'Disabled' || (origin === 'register' && isRegistrationAllowedForSecret);

	if (origin === 'secret-register' && !isRegistrationAllowedForSecret) {
		return <SecretRegisterInvalidForm />;
	}

	if (isPublicRegistration) {
		return (
			<HorizontalTemplate>
				<LoginRegisterForm setLoginRoute={setLoginRoute} />
			</HorizontalTemplate>
		);
	}

	if (isRegistrationDisabled) {
		return (
			<HorizontalTemplate>
				<RegisterFormDisabled setLoginRoute={setLoginRoute} />
			</HorizontalTemplate>
		);
	}

	if (isRegistrationAllowedForSecret) {
		return <SecretRegisterForm setLoginRoute={setLoginRoute} />;
	}

	return (
		<HorizontalTemplate>
			<FormSkeleton />
		</HorizontalTemplate>
	);
};

export default RegisterSecretPageRouter;

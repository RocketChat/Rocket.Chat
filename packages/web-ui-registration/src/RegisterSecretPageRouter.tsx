import { useDocumentTitle } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

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
	origin: 'register' | 'secret-register' | 'invite-register';
}): ReactElement => {
	const { t } = useTranslation();
	const registrationMode = useSetting<string>('Accounts_RegistrationForm');

	const isPublicRegistration = registrationMode === 'Public';
	const isRegistrationAllowedForSecret = registrationMode === 'Secret URL';
	const isRegistrationDisabled = registrationMode === 'Disabled' || (origin === 'register' && isRegistrationAllowedForSecret);

	useDocumentTitle(t('registration.component.form.createAnAccount'), false);

	if (origin === 'secret-register' && !isRegistrationAllowedForSecret) {
		return <SecretRegisterInvalidForm />;
	}

	if (isPublicRegistration || (origin === 'invite-register' && isRegistrationAllowedForSecret)) {
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

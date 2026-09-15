import { useDocumentTitle } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RegisterForm from './RegisterForm.js';
import RegisterFormDisabled from './RegisterFormDisabled.js';
import RegisterTemplate from './RegisterTemplate.js';
import SecretRegisterForm from './SecretRegisterForm.js';
import SecretRegisterInvalidForm from './SecretRegisterInvalidForm.js';
import type { DispatchLoginRouter } from './hooks/useLoginRouter.js';
import FormSkeleton from './template/FormSkeleton.js';

export const RegisterSecretPageRouter = ({
	setLoginRoute,
	origin,
}: {
	setLoginRoute: DispatchLoginRouter;
	origin: 'register' | 'secret-register' | 'invite-register';
}) => {
	const { t } = useTranslation();
	const registrationMode = useSetting<'Public' | 'Disabled' | 'Secret URL'>('Accounts_RegistrationForm', 'Public');

	const isPublicRegistration = registrationMode === 'Public';
	const isRegistrationAllowedForSecret = registrationMode === 'Secret URL';
	const isRegistrationDisabled = registrationMode === 'Disabled' || (origin === 'register' && isRegistrationAllowedForSecret);

	useDocumentTitle(t('registration.component.form.createAnAccount'), false);

	if (origin === 'secret-register' && !isRegistrationAllowedForSecret) {
		return <SecretRegisterInvalidForm />;
	}

	if (isPublicRegistration || (origin === 'invite-register' && isRegistrationAllowedForSecret)) {
		return (
			<RegisterTemplate aria-label={t('Register')}>
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

import { useTranslation } from 'react-i18next';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';

type Params = {
	setError: any;
	setLoginRoute: (route: 'login') => void;
	setServerError: (value: string | undefined) => void;
};

export const useRegisterErrorHandling = ({ setError, setLoginRoute, setServerError }: Params) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return (error: any): void => {
		if ([error.error, error.errorType].includes('error-invalid-email')) {
			setError('email', { type: 'invalid-email', message: t('registration.component.form.invalidEmail') });
		}

		if (error.errorType === 'error-user-already-exists') {
			setError('username', { type: 'user-already-exists', message: t('registration.component.form.usernameAlreadyExists') });
		}

		if (/Email already exists/.test(error.error)) {
			setError('email', { type: 'email-already-exists', message: t('registration.component.form.emailAlreadyExists') });
		}

		if (/Username is already in use/.test(error.error)) {
			setError('username', { type: 'username-already-exists', message: t('registration.component.form.userAlreadyExist') });
		}

		if (/The username provided is not valid/.test(error.error)) {
			setError('username', {
				type: 'username-contains-invalid-chars',
				message: t('registration.component.form.usernameContainsInvalidChars'),
			});
		}

		if (/Name contains invalid characters/.test(error.error)) {
			setError('name', { type: 'name-contains-invalid-chars', message: t('registration.component.form.nameContainsInvalidChars') });
		}

		if (/error-too-many-requests/.test(error.error)) {
			dispatchToastMessage({ type: 'error', message: error.error });
		}

		if (/error-user-is-not-activated/.test(error.error)) {
			dispatchToastMessage({ type: 'info', message: t('registration.page.registration.waitActivationWarning') });
			setLoginRoute('login');
		}

		if (error.error === 'error-user-registration-custom-field') {
			setServerError(error.message);
		}
	};
};

import { useTranslation } from 'react-i18next';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { UseFormSetError } from 'react-hook-form';
import type { DispatchLoginRouter } from './useLoginRouter';

type LoginRegisterPayload = {
    name: string;
    passwordConfirmation: string;
    username: string;
    password: string;
    email: string;
    reason: string;
};

export const useRegistrationErrors = (
    setError: UseFormSetError<LoginRegisterPayload>,
    setLoginRoute: DispatchLoginRouter,
    setServerError: (error: string | undefined) => void,
) => {
    const { t } = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();

    const handleRegistrationError = (error: any) => {
        if ([error.error, error.errorType].includes('error-invalid-email')) {
            setError('email', { type: 'invalid-email', message: t('registration.component.form.invalidEmail') });
            return;
        }

        if (error.errorType === 'error-user-already-exists') {
            setError('username', { type: 'user-already-exists', message: t('registration.component.form.usernameAlreadyExists') });
            return;
        }

        if (/Email already exists/.test(error.error)) {
            setError('email', { type: 'email-already-exists', message: t('registration.component.form.emailAlreadyExists') });
            return;
        }

        if (/Username is already in use/.test(error.error)) {
            setError('username', { type: 'username-already-exists', message: t('registration.component.form.userAlreadyExist') });
            return;
        }

        if (/The username provided is not valid/.test(error.error)) {
            setError('username', {
                type: 'username-contains-invalid-chars',
                message: t('registration.component.form.usernameContainsInvalidChars'),
            });
            return;
        }

        if (/Name contains invalid characters/.test(error.error)) {
            setError('name', { type: 'name-contains-invalid-chars', message: t('registration.component.form.nameContainsInvalidChars') });
            return;
        }

        if (/error-too-many-requests/.test(error.error)) {
            dispatchToastMessage({ type: 'error', message: error.error });
            return;
        }

        if (/error-user-is-not-activated/.test(error.error)) {
            dispatchToastMessage({ type: 'info', message: t('registration.page.registration.waitActivationWarning') });
            setLoginRoute('login');
            return;
        }

        if (error.error === 'error-user-registration-custom-field') {
            setServerError(error.message);
        }
    };

    return { handleRegistrationError };
};

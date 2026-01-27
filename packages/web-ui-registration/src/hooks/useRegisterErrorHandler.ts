import type { UseFormSetError } from 'react-hook-form';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';
import type { DispatchLoginRouter } from './useLoginRouter';

type LoginRegisterPayload = {
    name: string;
    passwordConfirmation: string;
    username: string;
    password: string;
    email: string;
    reason: string;
};

export const useRegisterErrorHandler = (
    setError: UseFormSetError<LoginRegisterPayload>,
    setServerError: (error: string | undefined) => void,
    setLoginRoute: DispatchLoginRouter,
) => {
    const { t } = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();

    const handleRegisterError = (error: any) => {
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

    return { handleRegisterError };
};

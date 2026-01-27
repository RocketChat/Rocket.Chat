import { useSetting } from '@rocket.chat/ui-contexts';
import { useValidatePassword } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export const useRegistrationValidation = (password: string) => {
    const { t } = useTranslation();
    const requireNameForRegister = useSetting('Accounts_RequireNameForSignUp', true);
    const passwordIsValid = useValidatePassword(password);

    const getNameValidation = () => ({
        required: requireNameForRegister ? t('Required_field', { field: t('registration.component.form.name') }) : false,
    });

    const getEmailValidation = () => ({
        required: t('Required_field', { field: t('registration.component.form.email') }),
        pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: t('registration.component.form.invalidEmail'),
        },
    });

    const getUsernameValidation = () => ({
        required: t('Required_field', { field: t('registration.component.form.username') }),
    });

    const getPasswordValidation = () => ({
        required: t('Required_field', { field: t('registration.component.form.password') }),
        validate: () => (!passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
    });

    const getPasswordConfirmationValidation = (watchPassword: string) => ({
        required: t('Required_field', { field: t('registration.component.form.confirmPassword') }),
        deps: ['password'],
        validate: (val: string) => (watchPassword === val ? true : t('registration.component.form.invalidConfirmPass')),
    });

    const getReasonValidation = () => ({
        required: t('Required_field', { field: t('registration.component.form.reasonToJoin') }),
    });

    return {
        getNameValidation,
        getEmailValidation,
        getUsernameValidation,
        getPasswordValidation,
        getPasswordConfirmationValidation,
        getReasonValidation,
        passwordIsValid,
    };
};

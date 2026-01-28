import { useSetting } from '@rocket.chat/ui-contexts';
import { useValidatePassword } from '@rocket.chat/ui-client';
import type { UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type LoginRegisterPayload = {
    name: string;
    passwordConfirmation: string;
    username: string;
    password: string;
    email: string;
    reason: string;
};

export const useRegisterFormValidation = (watch: UseFormWatch<LoginRegisterPayload>) => {
    const { t } = useTranslation();
    const requireNameForRegister = useSetting('Accounts_RequireNameForSignUp', true);
    const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation', true);
    const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers', false);

    const { password } = watch();
    const passwordIsValid = useValidatePassword(password);

    const validationRules = {
        name: {
            required: requireNameForRegister ? t('Required_field', { field: t('registration.component.form.name') }) : false,
        },
        email: {
            required: t('Required_field', { field: t('registration.component.form.email') }),
            pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('registration.component.form.invalidEmail'),
            },
        },
        username: {
            required: t('Required_field', { field: t('registration.component.form.username') }),
        },
        password: {
            required: t('Required_field', { field: t('registration.component.form.password') }),
            validate: () => (!passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
        },
        passwordConfirmation: {
            required: t('Required_field', { field: t('registration.component.form.confirmPassword') }),
            deps: ['password'] as const,
            validate: (val: string) => (watch('password') === val ? true : t('registration.component.form.invalidConfirmPass')),
        },
        reason: {
            required: t('Required_field', { field: t('registration.component.form.reasonToJoin') }),
        },
    };

    return {
        validationRules,
        requireNameForRegister,
        requiresPasswordConfirmation,
        manuallyApproveNewUsersRequired,
        passwordIsValid,
    };
};

import { Field, FieldLabel, FieldRow, FieldError, PasswordInput } from '@rocket.chat/fuselage';
import { PasswordVerifier } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import type { FieldError as FieldErrorType, UseFormRegisterReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type PasswordFieldWithVerifierProps = {
    passwordId: string;
    passwordVerifierId: string;
    passwordConfirmationId?: string;
    passwordError?: FieldErrorType;
    passwordConfirmationError?: FieldErrorType;
    passwordRegister: UseFormRegisterReturn;
    passwordConfirmationRegister?: UseFormRegisterReturn;
    password: string;
    passwordIsValid: boolean;
    requiresPasswordConfirmation: boolean;
    passwordPlaceholder?: string;
    passwordConfirmationPlaceholder?: string;
};

export const PasswordFieldWithVerifier = ({
    passwordId,
    passwordVerifierId,
    passwordConfirmationId,
    passwordError,
    passwordConfirmationError,
    passwordRegister,
    passwordConfirmationRegister,
    password,
    passwordIsValid,
    requiresPasswordConfirmation,
    passwordPlaceholder,
    passwordConfirmationPlaceholder,
}: PasswordFieldWithVerifierProps): ReactElement => {
    const { t } = useTranslation();

    return (
        <>
            <Field>
                <FieldLabel required htmlFor={passwordId}>
                    {t('registration.component.form.password')}
                </FieldLabel>
                <FieldRow>
                    <PasswordInput
                        {...passwordRegister}
                        error={passwordError?.message}
                        aria-required='true'
                        aria-invalid={passwordError ? 'true' : undefined}
                        id={passwordId}
                        placeholder={passwordPlaceholder || t('Create_a_password')}
                        aria-describedby={`${passwordVerifierId} ${passwordId}-error`}
                    />
                </FieldRow>
                {passwordError && (
                    <FieldError role='alert' id={`${passwordId}-error`}>
                        {passwordError.message}
                    </FieldError>
                )}
                <PasswordVerifier password={password} id={passwordVerifierId} />
            </Field>
            {requiresPasswordConfirmation && passwordConfirmationId && passwordConfirmationRegister && (
                <Field>
                    <FieldLabel required htmlFor={passwordConfirmationId}>
                        {t('registration.component.form.confirmPassword')}
                    </FieldLabel>
                    <FieldRow>
                        <PasswordInput
                            {...passwordConfirmationRegister}
                            error={passwordConfirmationError?.message}
                            aria-required='true'
                            aria-invalid={passwordConfirmationError ? 'true' : 'false'}
                            id={passwordConfirmationId}
                            aria-describedby={`${passwordConfirmationId}-error`}
                            placeholder={passwordConfirmationPlaceholder || t('Confirm_password')}
                            disabled={!passwordIsValid}
                        />
                    </FieldRow>
                    {passwordConfirmationError && (
                        <FieldError role='alert' id={`${passwordConfirmationId}-error`}>
                            {passwordConfirmationError.message}
                        </FieldError>
                    )}
                </Field>
            )}
        </>
    );
};

import {
    FieldGroup,
    TextInput,
    Field,
    FieldLabel,
    FieldRow,
    FieldError,
    FieldLink,
    PasswordInput,
    ButtonGroup,
    Button,
    Callout,
} from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import { useLoginWithPassword, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import EmailConfirmationForm from './EmailConfirmationForm';
import LoginServices from './LoginServices';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { startAuthentication } from '@simplewebauthn/browser';
import { Meteor } from 'meteor/meteor';

interface VerificationResponseJSON {
    success: boolean;
    userId: string | null;
    authToken?: string;
    error?: string;
}

const LOGIN_SUBMIT_ERRORS = {
    'error-user-is-not-activated': {
        type: 'warning',
        i18n: 'registration.page.registration.waitActivationWarning',
    },
    'error-app-user-is-not-allowed-to-login': {
        type: 'danger',
        i18n: 'registration.page.login.errors.AppUserNotAllowedToLogin',
    },
    'user-not-found': {
        type: 'danger',
        i18n: 'registration.page.login.errors.wrongCredentials',
    },
    'error-login-blocked-for-ip': {
        type: 'danger',
        i18n: 'registration.page.login.errors.loginBlockedForIp',
    },
    'error-login-blocked-for-user': {
        type: 'danger',
        i18n: 'registration.page.login.errors.loginBlockedForUser',
    },
    'error-license-user-limit-reached': {
        type: 'warning',
        i18n: 'registration.page.login.errors.licenseUserLimitReached',
    },
    'error-invalid-email': {
        type: 'danger',
        i18n: 'registration.page.login.errors.invalidEmail',
    },
    'error-username-param-not-provided': {
        type: 'danger',
        i18n: 'registration.page.login.errors.usernameRequired',
    },
    'error-passkey-verification-failed': {
        type: 'danger',
        i18n: 'registration.page.login.errors.passkeyVerificationFailed',
    },
    'error-passkey-login-failed': {
        type: 'danger',
        i18n: 'registration.page.login.errors.passkeyLoginFailed',
    },
    'error-token-login-failed': {
        type: 'danger',
        i18n: 'registration.page.login.errors.tokenLoginFailed',
    },
    'error-no-passkeys': {
        type: 'danger',
        i18n: 'registration.page.login.errors.noPasskeys',
    },
} as const;

interface OptionsJSONType {
    options?: any; 
}

export type LoginErrors = keyof typeof LOGIN_SUBMIT_ERRORS | 'totp-canceled' | string;
export type LoginErrorState = [error: LoginErrors, message?: string] | undefined;
export const LoginForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        getValues,
        formState: { errors }, 
    } = useForm<{ usernameOrEmail: string; password: string }>({
        mode: 'onBlur',
    });
    const generateAuthenticationOptions = useEndpoint('GET', '/v1/passkey/loginOptions');
    const verifyAuthentication = useEndpoint('POST', '/v1/passkey/loginVerify');
    const [isLoading, setIsLoading] = useState(false); 

    const handlePasskeyLogin = async () => {
        setErrorOnSubmit(undefined);
    
        if (isLoading) return;
        
        try {
            setIsLoading(true);
            const usernameOrEmail = getValues('usernameOrEmail');
            if (!usernameOrEmail) {
                setError('usernameOrEmail', {
                    type: 'required',
                    message: t('Required_field', { field: t('registration.component.form.emailOrUsername') }),
                });
                return;
            }
    
            console.log('Calling generateAuthenticationOptions with username:', usernameOrEmail);
            const optionsJSON = await generateAuthenticationOptions({ username: usernameOrEmail });
            console.log('Received options:', optionsJSON);
    
            if (!optionsJSON || !(optionsJSON as OptionsJSONType).options) {
                setErrorOnSubmit(['error-passkey-login-failed', t('registration.page.login.errors.passkeyLoginFailed')]);
                return;
            }
    
            console.log('Calling startAuthentication with options:', (optionsJSON as OptionsJSONType).options);
            const asseResp = await startAuthentication((optionsJSON as OptionsJSONType).options).catch(error => {
                if (error.name === 'AbortError') {
                    console.log('Authentication was aborted by user');
                    return null;
                }
                throw error;
            });
    
            if (!asseResp) {
                return; 
            }
    
            console.log('startAuthentication completed:', asseResp);
            const verificationResp = await verifyAuthentication({
                username: usernameOrEmail,
                authenticationResponse: asseResp,
            }) as unknown as VerificationResponseJSON;
            console.log('Verification Completed', verificationResp);
            if (verificationResp && typeof verificationResp === 'object' && 'success' in verificationResp && verificationResp.success) {
                console.log('Verification Successful');
                const authToken = verificationResp?.authToken;
                const userId = verificationResp?.userId;
                  
                if (authToken && userId) {
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('userId', userId); 
                    
                    localStorage.setItem('Meteor.loginToken', authToken);
                    localStorage.setItem('Meteor.userId', userId);

                    Meteor.loginWithToken(authToken, (error: Meteor.Error | Error | undefined) => {
                        if (error) {
                            console.error('Error logging in with token:', error);
                            setErrorOnSubmit(['error-token-login-failed', t('registration.page.login.errors.tokenLoginFailed')]);
                        } else {
                            window.location.href = '/home'; 
                        }
                    });
                } else {
                    setErrorOnSubmit(['error-invalid-login-response', t('registration.page.login.errors.invalidLoginResponse')]);
                }
            } else {
                setErrorOnSubmit(['error-passkey-verification-failed', t('registration.page.login.errors.passkeyVerificationFailed')]);
            }
        } catch (error: any) {
            console.error('Passkey login error:', error);
            setErrorOnSubmit(['error-passkey-login-failed', 
                error.message || t('registration.page.login.errors.passkeyLoginFailed')]);
        } finally {
            setIsLoading(false);
        }
    };

    const { t } = useTranslation();
    const formLabelId = useId();
    const [errorOnSubmit, setErrorOnSubmit] = useState<LoginErrorState>(undefined);
    const isResetPasswordAllowed = useSetting('Accounts_PasswordReset', true);
    const login = useLoginWithPassword();
    const showFormLogin = useSetting('Accounts_ShowFormLogin', true);
    const usernameOrEmailPlaceholder = useSetting('Accounts_EmailOrUsernamePlaceholder', '');
    const passwordPlaceholder = useSetting('Accounts_PasswordPlaceholder', '');
    useDocumentTitle(t('registration.component.login'), false);
    const loginMutation = useMutation({
        mutationFn: (formData: { usernameOrEmail: string; password: string }) => {
            return login(formData.usernameOrEmail, formData.password);
        },
        onError: (error: any) => {
            if ([error.error, error.errorType].includes('error-invalid-email')) {
                setError('usernameOrEmail', { type: 'invalid-email', message: t('registration.page.login.errors.invalidEmail') });
            }
            if ('error' in error && error.error !== 403) {
                setErrorOnSubmit([error.error, error.reason]);
                return;
            }
            setErrorOnSubmit(['user-not-found']);
        },
    });
    const usernameId = useId();
    const passwordId = useId();
    const loginFormRef = useRef<HTMLElement>(null);
    useEffect(() => {
        if (loginFormRef.current) {
            loginFormRef.current.focus();
        }
    }, [errorOnSubmit]);
    
    const renderErrorOnSubmit = ([error, message]: Exclude<LoginErrorState, undefined>) => {
        if (error in LOGIN_SUBMIT_ERRORS) {
            const { type, i18n } = LOGIN_SUBMIT_ERRORS[error as Exclude<LoginErrors, string>];
            return (
                <Callout id={`${usernameId}-error`} aria-live='assertive' type={type}>
                    {t(i18n)}
                </Callout>
            );
        }
        if (error === 'totp-canceled') {
            return null;
        }
        if (message) {
            return (
                <Callout id={`${usernameId}-error`} aria-live='assertive' type='danger'>
                    {message}
                </Callout>
            );
        }
        return null;
    };
    if (errors.usernameOrEmail?.type === 'invalid-email') {
        return <EmailConfirmationForm onBackToLogin={() => clearErrors('usernameOrEmail')} email={getValues('usernameOrEmail')} />;
    }
    return (
        <Form
            tabIndex={-1}
            ref={loginFormRef}
            aria-labelledby={formLabelId}
            aria-describedby='welcomeTitle'
            onSubmit={handleSubmit(async (data) => loginMutation.mutate(data))}
        >
            <Form.Header>
                <Form.Title id={formLabelId}>{t('registration.component.login')}</Form.Title>
            </Form.Header>
            {showFormLogin && (
                <>
                    <Form.Container>
                        <FieldGroup disabled={loginMutation.isPending}>
                            <Field>
                                <FieldLabel required htmlFor={usernameId}>
                                    {t('registration.component.form.emailOrUsername')}
                                </FieldLabel>
                                <FieldRow>
                                    <TextInput
                                        {...register('usernameOrEmail', {
                                            required: t('Required_field', { field: t('registration.component.form.emailOrUsername') }),
                                        })}
                                        placeholder={usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder')}
                                        error={errors.usernameOrEmail?.message}
                                        aria-invalid={errors.usernameOrEmail || errorOnSubmit ? 'true' : 'false'}
                                        aria-describedby={`${usernameId}-error`}
                                        id={usernameId}
                                    />
                                </FieldRow>
                                {errors.usernameOrEmail && (
                                    <FieldError aria-live='assertive' id={`${usernameId}-error`}>
                                        {errors.usernameOrEmail.message}
                                    </FieldError>
                                )}
                            </Field>
                            <Field>
                                <FieldLabel required htmlFor={passwordId}>
                                    {t('registration.component.form.password')}
                                </FieldLabel>
                                <FieldRow>
                                    <PasswordInput
                                        {...register('password', {
                                            required: t('Required_field', { field: t('registration.component.form.password') }),
                                        })}
                                        placeholder={passwordPlaceholder}
                                        error={errors.password?.message}
                                        aria-invalid={errors.password || errorOnSubmit ? 'true' : 'false'}
                                        aria-describedby={`${passwordId}-error`}
                                        id={passwordId}
                                    />
                                </FieldRow>
                                {errors.password && (
                                    <FieldError aria-live='assertive' id={`${passwordId}-error`}>
                                        {errors.password.message}
                                    </FieldError>
                                )}
                                {isResetPasswordAllowed && (
                                    <FieldRow justifyContent='end'>
                                        <FieldLink
                                            href='#'
                                            onClick={(e): void => {
                                                e.preventDefault();
                                                setLoginRoute('reset-password');
                                            }}
                                        >
                                            <Trans i18nKey='registration.page.login.forgot'>Forgot your password?</Trans>
                                        </FieldLink>
                                    </FieldRow>
                                )}
                            </Field>
                        </FieldGroup>
                        {errorOnSubmit && <FieldGroup disabled={loginMutation.isPending}>{renderErrorOnSubmit(errorOnSubmit)}</FieldGroup>}
                    </Form.Container>
                    <Form.Footer>
                        <ButtonGroup>
                            <Button loading={loginMutation.isPending} type='submit' primary>
                                {t('registration.component.login')}
                            </Button>
                            <button onClick={handlePasskeyLogin} disabled={isLoading}>
                                {isLoading ? 'Waiting for passkey...' : 'Login with Passkey'}
                            </button>
                        </ButtonGroup>
                        <p>
                            <Trans i18nKey='registration.page.login.register'>
                                New here? <ActionLink onClick={(): void => setLoginRoute('register')}>Create an account</ActionLink>
                            </Trans>
                        </p>
                    </Form.Footer>
                </>
            )}
            <LoginServices disabled={loginMutation.isPending} setError={setErrorOnSubmit} />
        </Form>
    );
};
export default LoginForm;

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
import { useLoginWithPassword, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import EmailConfirmationForm from './EmailConfirmationForm';
import LoginServices from './LoginServices';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';

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
} as const;

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

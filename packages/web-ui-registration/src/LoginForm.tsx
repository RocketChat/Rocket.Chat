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
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import { useLoginWithPassword, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
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

export type LoginErrors = keyof typeof LOGIN_SUBMIT_ERRORS;

export const LoginForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const {
		register,
		handleSubmit,
		setError,
		clearErrors,
		getValues,
		formState: { errors },
	} = useForm<{ username: string; password: string }>({
		mode: 'onBlur',
	});

	const { t } = useTranslation();
	const formLabelId = useUniqueId();
	const [errorOnSubmit, setErrorOnSubmit] = useState<LoginErrors | undefined>(undefined);
	const isResetPasswordAllowed = useSetting('Accounts_PasswordReset');
	const login = useLoginWithPassword();
	const showFormLogin = useSetting('Accounts_ShowFormLogin');

	const usernameOrEmailPlaceholder = String(useSetting('Accounts_EmailOrUsernamePlaceholder'));
	const passwordPlaceholder = String(useSetting('Accounts_PasswordPlaceholder'));

	useDocumentTitle(t('registration.component.login'), false);

	const loginMutation = useMutation({
		mutationFn: (formData: { username: string; password: string }) => {
			return login(formData.username, formData.password);
		},
		onError: (error: any) => {
			if ([error.error, error.errorType].includes('error-invalid-email')) {
				setError('username', { type: 'invalid-email', message: t('registration.page.login.errors.invalidEmail') });
			}

			if ('error' in error && error.error !== 403) {
				setErrorOnSubmit(error.error);
				return;
			}

			setErrorOnSubmit('user-not-found');
		},
	});

	const usernameId = useUniqueId();
	const passwordId = useUniqueId();
	const loginFormRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (loginFormRef.current) {
			loginFormRef.current.focus();
		}
	}, [errorOnSubmit]);

	const renderErrorOnSubmit = (error: LoginErrors) => {
		const { type, i18n } = LOGIN_SUBMIT_ERRORS[error];
		return (
			<Callout id={`${usernameId}-error`} aria-live='assertive' type={type}>
				{t(i18n)}
			</Callout>
		);
	};

	if (errors.username?.type === 'invalid-email') {
		return <EmailConfirmationForm onBackToLogin={() => clearErrors('username')} email={getValues('username')} />;
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
						<FieldGroup disabled={loginMutation.isLoading}>
							<Field>
								<FieldLabel required htmlFor={usernameId}>
									{t('registration.component.form.emailOrUsername')}
								</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('username', {
											required: t('registration.component.form.requiredField'),
										})}
										placeholder={usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder')}
										error={errors.username?.message}
										aria-invalid={errors.username || errorOnSubmit ? 'true' : 'false'}
										aria-describedby={`${usernameId}-error`}
										id={usernameId}
									/>
								</FieldRow>
								{errors.username && (
									<FieldError aria-live='assertive' id={`${usernameId}-error`}>
										{errors.username.message}
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
											required: t('registration.component.form.requiredField'),
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
						{errorOnSubmit && <FieldGroup disabled={loginMutation.isLoading}>{renderErrorOnSubmit(errorOnSubmit)}</FieldGroup>}
					</Form.Container>
					<Form.Footer>
						<ButtonGroup stretch>
							<Button loading={loginMutation.isLoading} type='submit' primary>
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
			<LoginServices disabled={loginMutation.isLoading} setError={setErrorOnSubmit} />
		</Form>
	);
};

export default LoginForm;

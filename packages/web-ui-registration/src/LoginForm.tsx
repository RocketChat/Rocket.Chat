import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { FieldGroup, TextInput, Field, PasswordInput, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useLoginWithPassword, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import EmailConfirmationForm from './EmailConfirmationForm';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import Services from './Services';

type LoginErrors =
	| 'error-user-is-not-activated'
	| 'error-invalid-email'
	| 'error-login-blocked-for-ip'
	| 'error-login-blocked-for-user'
	| 'error-license-user-limit-reached'
	| 'user-not-found'
	| 'error-app-user-is-not-allowed-to-login';

export const LoginForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const {
		register,
		handleSubmit,
		setError,
		clearErrors,
		getValues,
		formState: { errors },
	} = useForm<{
		email?: string;
		username: string;
		password: string;
	}>({
		mode: 'onChange',
	});

	const formLabelId = useUniqueId();

	const [errorOnSubmit, setErrorOnSubmit] = useState<LoginErrors | undefined>(undefined);

	const isResetPasswordAllowed = useSetting('Accounts_PasswordReset');

	const { t } = useTranslation();

	const login = useLoginWithPassword();

	if (errors.email?.type === 'invalid-email') {
		return (
			<EmailConfirmationForm
				onBackToLogin={() => clearErrors('email')}
				email={getValues('username')?.includes('@') ? getValues('username') : undefined}
			/>
		);
	}

	return (
		<Form
			aria-labelledby={formLabelId}
			onSubmit={handleSubmit(async (data) => {
				try {
					await login(data.username, data.password);
				} catch (error: any) {
					if ([error.error, error.errorType].includes('error-invalid-email')) {
						setError('email', { type: 'invalid-email', message: t('Invalid_email') });
					}

					if ('error' in error && error.error !== 403) {
						setErrorOnSubmit(error.error);
						return;
					}

					setErrorOnSubmit('user-not-found');
					setError('username', { type: 'user-not-found', message: t('User_not_found') });
					setError('password', { type: 'user-not-found', message: t('User_not_found') });
				}
			})}
		>
			<Form.Header>
				<Form.Title id={formLabelId}>{t('registration.component.login')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<Services />
				<FieldGroup>
					<Field>
						<Field.Label htmlFor='username'>{t('registration.component.form.emailOrUsername')}</Field.Label>
						<Field.Row>
							<TextInput
								{...register('username', {
									required: true,
								})}
								placeholder={t('registration.component.form.emailOrUsernamePlaceholder')}
								error={errors.username?.message}
								aria-invalid={errors.username || errorOnSubmit === 'user-not-found' ? 'true' : 'false'}
								id='username'
							/>
						</Field.Row>
						{errors.username && errors.username.type === 'required' && (
							<Field.Error>{t('registration.component.form.requiredField')}</Field.Error>
						)}
					</Field>

					<Field>
						<Field.Label htmlFor='password'>{t('registration.component.form.password')}</Field.Label>
						<Field.Row>
							<PasswordInput
								{...register('password', {
									required: true,
								})}
								placeholder={'*****'}
								error={errors.password?.message}
								aria-invalid={errors.password || errorOnSubmit === 'user-not-found' ? 'true' : 'false'}
								id='password'
							/>
						</Field.Row>
						{errors.password && errors.password.type === 'required' && (
							<Field.Error>{t('registration.component.form.requiredField')}</Field.Error>
						)}
						{isResetPasswordAllowed && (
							<Field.Row justifyContent='end'>
								<Field.Link
									href='#'
									onClick={(e): void => {
										e.preventDefault();
										setLoginRoute('reset-password');
									}}
								>
									<Trans i18nKey='registration.page.login.forgot'>Forgot your password?</Trans>
								</Field.Link>
							</Field.Row>
						)}
					</Field>
				</FieldGroup>
				<FieldGroup>
					{errorOnSubmit === 'error-user-is-not-activated' && (
						<Callout type='warning'>{t('registration.page.registration.waitActivationWarning')}</Callout>
					)}

					{errorOnSubmit === 'error-app-user-is-not-allowed-to-login' && (
						<Callout type='danger'>{t('registration.page.login.errors.AppUserNotAllowedToLogin')}</Callout>
					)}
					{errorOnSubmit === 'user-not-found' && <Callout type='danger'>{t('registration.page.login.errors.wrongCredentials')}</Callout>}
					{errorOnSubmit === 'error-login-blocked-for-ip' && (
						<Callout type='danger'>{t('registration.page.login.errors.loginBlockedForIp')}</Callout>
					)}
					{errorOnSubmit === 'error-login-blocked-for-user' && (
						<Callout type='danger'>{t('registration.page.login.errors.loginBlockedForUser')}</Callout>
					)}

					{errorOnSubmit === 'error-license-user-limit-reached' && (
						<Callout type='warning'>{t('registration.page.login.errors.licenseUserLimitReached')}</Callout>
					)}
					{/* error-invalid-email */}
				</FieldGroup>
			</Form.Container>
			<Form.Footer>
				<ButtonGroup stretch>
					<Button type='submit' primary>
						{t('registration.component.login')}
					</Button>
				</ButtonGroup>
				<p>
					<Trans i18nKey='registration.page.login.register'>
						New here? <ActionLink onClick={(): void => setLoginRoute('register')}>Register</ActionLink>
					</Trans>
				</p>
			</Form.Footer>
		</Form>
	);
};

export default LoginForm;

import { FieldGroup, TextInput, Field, PasswordInput, ButtonGroup, Button, TextAreaInput, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Trans } from 'react-i18next';

import { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useRegisterMethod } from './hooks/useRegisterMethod';

export const LoginRegisterForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const t = useTranslation();

	const requireNameForRegister = Boolean(useSetting('Accounts_RequireNameForSignUp'));
	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');

	const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers');

	const {
		register,
		handleSubmit,
		setError,
		watch,
		formState: { errors },
	} = useForm<{
		name: string;
		passwordConfirmation: string;
		username: string;
		password: string;
		email: string;
		reason: string;
	}>();

	const registerUser = useRegisterMethod();

	const isRegistrationAllowed = useSetting('Accounts_RegistrationForm') === 'Public';

	const linkReplacementText = String(useSetting('Accounts_RegistrationForm_LinkReplacementText'));

	return (
		<Form
			onSubmit={handleSubmit(async ({ password, passwordConfirmation: _, ...formData }) => {
				try {
					await registerUser({ pass: password, ...formData });
				} catch (error: any) {
					if (error.errorType === 'error-invalid-email') {
						setError('email', { type: 'invalid-email', message: t('Invalid_email') });
					}
					if (error.errorType === 'error-user-already-exists') {
						setError('username', { type: 'user-already-exists', message: t('Username_already_exist') });
					}

					if (/Email already exists/.test(error.error)) {
						setError('email', { type: 'email-already-exists', message: t('Email_already_exists') });
					}

					if (/Username is already in use/.test(error.error)) {
						setError('username', { type: 'username-already-exists', message: t('Username_already_exist') });
					}
				}
			})}
		>
			<Form.Header>
				<Form.Title>{t('Register')}</Form.Title>
			</Form.Header>
			<Form.Container>
				{!isRegistrationAllowed && <Callout type='warning'>{linkReplacementText}</Callout>}
				{isRegistrationAllowed && (
					<>
						<FieldGroup>
							<Field>
								<Field.Label htmlFor='name'>{requireNameForRegister ? `${t('Name')}*` : t('Name_optional')}</Field.Label>
								<Field.Row>
									<TextInput
										{...register('name', {
											required: requireNameForRegister,
										})}
										placeholder={'Jon Doe'}
										error={
											errors.name &&
											t('The_field_is_required', {
												postProcess: 'sprintf',
												sprintf: [t('Name')],
											})
										}
										aria-invalid={errors.name ? 'true' : 'false'}
										id='name'
									/>
								</Field.Row>
								{errors.reason && (
									<Field.Error>
										{t('The_field_is_required', {
											postProcess: 'sprintf',
											sprintf: [t('Name')],
										})}
									</Field.Error>
								)}
							</Field>
							<Field>
								<Field.Label htmlFor='email'>{t('Email')}*</Field.Label>
								<Field.Row>
									<TextInput
										{...register('email', {
											required: true,
										})}
										placeholder={'your@email.com'}
										error={
											errors.email &&
											t('The_field_is_required', {
												postProcess: 'sprintf',
												sprintf: [t('Email')],
											})
										}
										aria-invalid={errors.email ? 'true' : undefined}
										id='email'
									/>
								</Field.Row>
								{errors.email && (
									<Field.Error>
										{errors.email.message ||
											t('The_field_is_required', {
												postProcess: 'sprintf',
												sprintf: [t('Email')],
											})}
									</Field.Error>
								)}
							</Field>
							<Field>
								<Field.Label htmlFor='username'>{t('Username')}*</Field.Label>
								<Field.Row>
									<TextInput
										{...register('username', {
											required: true,
										})}
										error={
											errors.username &&
											(errors.username.message || t('The_field_is_required', { postProcess: 'sprintf', sprintf: [t('Username')] }))
										}
										aria-invalid={errors.username ? 'true' : undefined}
										id='username'
									/>
								</Field.Row>
								{errors.username?.message && <Field.Error>{errors.username.message}</Field.Error>}
								{errors.username?.type === 'required' && (
									<Field.Error>{t('The_field_is_required', { postProcess: 'sprintf', sprintf: [t('Username')] })}</Field.Error>
								)}
							</Field>
							<Field>
								<Field.Label htmlFor='password'>{t('Password')}*</Field.Label>
								<Field.Row>
									<PasswordInput
										{...register('password', {
											required: true,
										})}
										placeholder={'******'}
										error={errors.password?.message}
										aria-invalid={errors.password ? 'true' : undefined}
										id='password'
									/>
								</Field.Row>
							</Field>
							{requiresPasswordConfirmation && (
								<Field>
									<Field.Label htmlFor='passwordConfirmation'>{t('Confirm_password')}*</Field.Label>
									<Field.Row>
										<PasswordInput
											{...register('passwordConfirmation', {
												required: true,
												deps: ['password'],
												validate: (val: string) => watch('password') === val,
											})}
											error={errors.passwordConfirmation?.type === 'validate' ? t('Invalid_confirm_pass') : undefined}
											placeholder={'******'}
											aria-invalid={errors.passwordConfirmation ? 'true' : false}
											id='passwordConfirmation'
										/>
									</Field.Row>
									{errors.passwordConfirmation?.type === 'validate' && <Field.Error>{t('Invalid_confirm_pass')}</Field.Error>}
								</Field>
							)}
							{manuallyApproveNewUsersRequired && (
								<Field>
									<Field.Label htmlFor='reason'>{t('Reason_To_Join')}*</Field.Label>
									<Field.Row>
										<TextAreaInput
											{...register('reason', {
												required: true,
											})}
											error={
												errors.reason &&
												t('The_field_is_required', {
													postProcess: 'sprintf',
												})
											}
											aria-invalid={errors.reason ? 'true' : undefined}
											id='reason'
										/>
									</Field.Row>
									{errors.reason && (
										<Field.Error>
											{t('The_field_is_required', {
												postProcess: 'sprintf',
												sprintf: [t('Reason_To_Join')],
											})}
										</Field.Error>
									)}
								</Field>
							)}
						</FieldGroup>
					</>
				)}
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					{isRegistrationAllowed && (
						<Button type='submit' primary>
							{t('Register')}
						</Button>
					)}
				</ButtonGroup>
				<ActionLink
					onClick={(): void => {
						setLoginRoute('login');
					}}
				>
					<Trans i18nKey='registration.page.register.back'>Back to Login</Trans>
				</ActionLink>
			</Form.Footer>
		</Form>
	);
};

export default LoginRegisterForm;

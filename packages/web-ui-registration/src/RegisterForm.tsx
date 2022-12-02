import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { FieldGroup, TextInput, Field, PasswordInput, ButtonGroup, Button, TextAreaInput } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Trans } from 'react-i18next';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useRegisterMethod } from './hooks/useRegisterMethod';

type LoginRegisterPayload = {
	name: string;
	passwordConfirmation: string;
	username: string;
	password: string;
	email: string;
	reason: string;
};

export const LoginRegisterForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const t = useTranslation();

	const requireNameForRegister = Boolean(useSetting('Accounts_RequireNameForSignUp'));
	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');
	const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers');

	const formLabelId = useUniqueId();
	const registerUser = useRegisterMethod();

	const {
		register,
		handleSubmit,
		setError,
		watch,
		formState: { errors },
	} = useForm<LoginRegisterPayload>();

	const handleRegister = async ({ password, passwordConfirmation: _, ...formData }: LoginRegisterPayload) => {
		registerUser.mutate(
			{ pass: password, ...formData },
			{
				onError: (error: any) => {
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
				},
			},
		);
	};

	return (
		<Form aria-labelledby={formLabelId} onSubmit={handleSubmit(handleRegister)}>
			<Form.Header>
				<Form.Title id={formLabelId}>{t('Create_an_account')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<Field.Label htmlFor='name'>{requireNameForRegister ? `${t('Name')}*` : t('Name_optional')}</Field.Label>
						<Field.Row>
							<TextInput
								{...register('name', {
									required: requireNameForRegister,
								})}
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
						{errors.name && (
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
								placeholder='example@example.com'
								error={
									errors.email &&
									t('The_field_is_required', {
										postProcess: 'sprintf',
										sprintf: [t('Email')],
									})
								}
								name='email'
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
								placeholder='jon.doe'
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
									required: t('The_field_is_required', { postProcess: 'sprintf', sprintf: [t('Password')] }),
								})}
								error={errors.password && (errors.password?.message || t('registration.component.form.requiredField'))}
								aria-invalid={errors.password ? 'true' : undefined}
								id='password'
							/>
						</Field.Row>
						{errors.password && <Field.Error>{errors.password.message}</Field.Error>}
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
									aria-invalid={errors.passwordConfirmation ? 'true' : false}
									id='passwordConfirmation'
								/>
							</Field.Row>
							{errors.passwordConfirmation?.type === 'validate' && <Field.Error>{t('Invalid_confirm_pass')}</Field.Error>}
							{errors.passwordConfirmation?.type === 'required' && (
								<Field.Error>{t('The_field_is_required', { postProcess: 'sprintf', sprintf: [t('Confirm_password')] })}</Field.Error>
							)}
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
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' disabled={registerUser.isLoading} primary>
						{t('Join_your_team')}
					</Button>
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

import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { FieldGroup, TextInput, Field, PasswordInput, ButtonGroup, Button, TextAreaInput } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useRegisterMethod } from './hooks/useRegisterMethod';
import EmailConfirmationForm from './EmailConfirmationForm';

type LoginRegisterPayload = {
	name: string;
	passwordConfirmation: string;
	username: string;
	password: string;
	email: string;
	reason: string;
};

export const RegisterForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const { t } = useTranslation();

	const requireNameForRegister = Boolean(useSetting('Accounts_RequireNameForSignUp'));
	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');
	const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers');

	const usernameOrEmailPlaceholder = String(useSetting('Accounts_EmailOrUsernamePlaceholder'));
	const passwordPlaceholder = String(useSetting('Accounts_PasswordPlaceholder'));
	const passwordConfirmationPlaceholder = String(useSetting('Accounts_ConfirmPasswordPlaceholder'));

	const formLabelId = useUniqueId();
	const registerUser = useRegisterMethod();

	const {
		register,
		handleSubmit,
		setError,
		watch,
		getValues,
		clearErrors,
		formState: { errors },
	} = useForm<LoginRegisterPayload>();

	const handleRegister = async ({ password, passwordConfirmation: _, ...formData }: LoginRegisterPayload) => {
		registerUser.mutate(
			{ pass: password, ...formData },
			{
				onError: (error: any) => {
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
				},
			},
		);
	};

	if (errors.email?.type === 'invalid-email') {
		return <EmailConfirmationForm onBackToLogin={() => clearErrors('email')} email={getValues('email')} />;
	}

	return (
		<Form aria-labelledby={formLabelId} onSubmit={handleSubmit(handleRegister)}>
			<Form.Header>
				<Form.Title id={formLabelId}>{t('registration.component.form.createAnAccount')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<Field.Label htmlFor='name'>
							{requireNameForRegister ? `${t('registration.component.form.name')}*` : t('registration.component.form.nameOptional')}
						</Field.Label>
						<Field.Row>
							<TextInput
								{...register('name', {
									required: requireNameForRegister,
								})}
								error={errors.name && t('registration.component.form.requiredField')}
								aria-invalid={errors.name ? 'true' : 'false'}
								id='name'
							/>
						</Field.Row>
						{errors.name && <Field.Error>{t('registration.component.form.requiredField')}</Field.Error>}
					</Field>
					<Field>
						<Field.Label htmlFor='email'>{t('registration.component.form.email')}*</Field.Label>
						<Field.Row>
							<TextInput
								{...register('email', {
									required: true,
								})}
								placeholder={usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder')}
								error={errors.email && t('registration.component.form.requiredField')}
								name='email'
								aria-invalid={errors.email ? 'true' : undefined}
								id='email'
							/>
						</Field.Row>
						{errors.email && <Field.Error>{errors.email.message || t('registration.component.form.requiredField')}</Field.Error>}
					</Field>
					<Field>
						<Field.Label htmlFor='username'>{t('registration.component.form.username')}*</Field.Label>
						<Field.Row>
							<TextInput
								{...register('username', {
									required: true,
								})}
								error={errors.username && (errors.username.message || t('registration.component.form.requiredField'))}
								aria-invalid={errors.username ? 'true' : undefined}
								id='username'
								placeholder='jon.doe'
							/>
						</Field.Row>
						{errors.username?.message && <Field.Error>{errors.username.message}</Field.Error>}
						{errors.username?.type === 'required' && <Field.Error>{t('registration.component.form.requiredField')}</Field.Error>}
					</Field>
					<Field>
						<Field.Label htmlFor='password'>{t('registration.component.form.password')}*</Field.Label>
						<Field.Row>
							<PasswordInput
								{...register('password', {
									required: t('registration.component.form.requiredField'),
								})}
								error={errors.password && (errors.password?.message || t('registration.component.form.requiredField'))}
								aria-invalid={errors.password ? 'true' : undefined}
								id='password'
								placeholder={passwordPlaceholder}
							/>
						</Field.Row>
						{errors.password && <Field.Error>{errors.password.message}</Field.Error>}
					</Field>
					{requiresPasswordConfirmation && (
						<Field>
							<Field.Label htmlFor='passwordConfirmation'>{t('registration.component.form.confirmPassword')}*</Field.Label>
							<Field.Row>
								<PasswordInput
									{...register('passwordConfirmation', {
										required: true,
										deps: ['password'],
										validate: (val: string) => watch('password') === val,
									})}
									error={errors.passwordConfirmation?.type === 'validate' ? t('registration.component.form.invalidConfirmPass') : undefined}
									aria-invalid={errors.passwordConfirmation ? 'true' : false}
									id='passwordConfirmation'
									placeholder={passwordConfirmationPlaceholder}
								/>
							</Field.Row>
							{errors.passwordConfirmation?.type === 'validate' && (
								<Field.Error>{t('registration.component.form.invalidConfirmPass')}</Field.Error>
							)}
							{errors.passwordConfirmation?.type === 'required' && (
								<Field.Error>{t('registration.component.form.requiredField')}</Field.Error>
							)}
						</Field>
					)}
					{manuallyApproveNewUsersRequired && (
						<Field>
							<Field.Label htmlFor='reason'>{t('registration.component.form.reasonToJoin')}*</Field.Label>
							<Field.Row>
								<TextAreaInput
									{...register('reason', {
										required: true,
									})}
									error={errors.reason && t('registration.component.form.requiredField')}
									aria-invalid={errors.reason ? 'true' : undefined}
									id='reason'
								/>
							</Field.Row>
							{errors.reason && <Field.Error>{t('registration.component.form.requiredField')}</Field.Error>}
						</Field>
					)}
				</FieldGroup>
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' disabled={registerUser.isLoading} primary>
						{t('registration.component.form.joinYourTeam')}
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

export default RegisterForm;

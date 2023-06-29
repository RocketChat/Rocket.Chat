import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { FieldGroup, TextInput, Field, PasswordInput, ButtonGroup, Button, TextAreaInput, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useAccountsCustomFields, useVerifyPassword, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { PasswordVerifier, CustomFieldsForm } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useState } from 'react';
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

// eslint-disable-next-line complexity
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
	const customFields = useAccountsCustomFields();

	const [serverError, setServerError] = useState<string | undefined>(undefined);

	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		handleSubmit,
		setError,
		watch,
		getValues,
		clearErrors,
		control,
		formState: { errors },
	} = useForm<LoginRegisterPayload>();

	const passwordVerifications = useVerifyPassword(watch('password'));

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
					if (/error-too-many-requests/.test(error.error)) {
						dispatchToastMessage({ type: 'error', message: error.error });
					}
					if (/error-user-is-not-activated/.test(error.error)) {
						dispatchToastMessage({ type: 'info', message: t('registration.page.registration.waitActivationWarning') });
						setLoginRoute('login');
					}
					if (error.error === 'error-user-registration-custom-field') {
						setServerError(error.message);
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
								placeholder={t('onboarding.form.adminInfoForm.fields.fullName.placeholder')}
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
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: t('registration.component.form.invalidEmail'),
									},
								})}
								placeholder={usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder')}
								error={errors.email && t('registration.component.form.invalidEmail')}
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
								placeholder={passwordPlaceholder || t('Create_a_password')}
							/>
						</Field.Row>
						{requiresPasswordConfirmation && (
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
									placeholder={passwordConfirmationPlaceholder || t('Confirm_password')}
								/>
							</Field.Row>
						)}
						{errors.passwordConfirmation?.type === 'validate' && requiresPasswordConfirmation && (
							<Field.Error>{t('registration.component.form.invalidConfirmPass')}</Field.Error>
						)}
						{errors.passwordConfirmation?.type === 'required' && requiresPasswordConfirmation && (
							<Field.Error>{t('registration.component.form.requiredField')}</Field.Error>
						)}
						{passwordVerifications && <PasswordVerifier password={watch('password')} passwordVerifications={passwordVerifications} />}
					</Field>
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
					{customFields.length > 0 && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFields} />}
					{serverError && <Callout type='danger'>{serverError}</Callout>}
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

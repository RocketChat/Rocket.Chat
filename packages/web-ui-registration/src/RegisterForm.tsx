/* eslint-disable complexity */
import { FieldGroup, TextInput, Field, PasswordInput, ButtonGroup, Button, TextAreaInput, Callout } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { Form, ActionLink } from '@rocket.chat/layout';
import { CustomFieldsForm, PasswordVerifier, useValidatePassword } from '@rocket.chat/ui-client';
import { useAccountsCustomFields, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import EmailConfirmationForm from './EmailConfirmationForm';
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

export const RegisterForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const { t } = useTranslation();

	const requireNameForRegister = Boolean(useSetting('Accounts_RequireNameForSignUp'));
	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');
	const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers');

	const usernameOrEmailPlaceholder = String(useSetting('Accounts_EmailOrUsernamePlaceholder'));
	const passwordPlaceholder = String(useSetting('Accounts_PasswordPlaceholder'));
	const passwordConfirmationPlaceholder = String(useSetting('Accounts_ConfirmPasswordPlaceholder'));

	const formLabelId = useUniqueId();
	const passwordVerifierId = useUniqueId();
	const nameId = useUniqueId();
	const emailId = useUniqueId();
	const usernameId = useUniqueId();
	const passwordId = useUniqueId();
	const passwordConfirmationId = useUniqueId();
	const reasonId = useUniqueId();

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
	} = useForm<LoginRegisterPayload>({ mode: 'onBlur' });

	const { password } = watch();
	const passwordIsValid = useValidatePassword(password);

	const registerFormRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (registerFormRef.current) {
			registerFormRef.current.focus();
		}
	}, []);

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
		<Form
			tabIndex={-1}
			ref={registerFormRef}
			aria-labelledby={formLabelId}
			aria-describedby='welcomeTitle'
			onSubmit={handleSubmit(handleRegister)}
		>
			<Form.Header>
				<Form.Title id={formLabelId}>{t('registration.component.form.createAnAccount')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<Field.Label required={requireNameForRegister} htmlFor={nameId}>
							{t('registration.component.form.name')}
						</Field.Label>
						<Field.Row>
							<TextInput
								{...register('name', {
									required: requireNameForRegister ? t('registration.component.form.requiredField') : false,
								})}
								error={errors?.name?.message}
								aria-required={requireNameForRegister}
								aria-invalid={errors.name ? 'true' : 'false'}
								placeholder={t('onboarding.form.adminInfoForm.fields.fullName.placeholder')}
								aria-describedby={`${nameId}-error`}
								id={nameId}
							/>
						</Field.Row>
						{errors.name && (
							<Field.Error aria-live='assertive' id={`${nameId}-error`}>
								{errors.name.message}
							</Field.Error>
						)}
					</Field>
					<Field>
						<Field.Label required htmlFor={emailId}>
							{t('registration.component.form.email')}
						</Field.Label>
						<Field.Row>
							<TextInput
								{...register('email', {
									required: t('registration.component.form.requiredField'),
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: t('registration.component.form.invalidEmail'),
									},
								})}
								placeholder={usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder')}
								error={errors?.email?.message}
								aria-required='true'
								aria-invalid={errors.email ? 'true' : 'false'}
								aria-describedby={`${emailId}-error`}
								id={emailId}
							/>
						</Field.Row>
						{errors.email && (
							<Field.Error aria-live='assertive' id={`${emailId}-error`}>
								{errors.email.message}
							</Field.Error>
						)}
					</Field>
					<Field>
						<Field.Label required htmlFor={usernameId}>
							{t('registration.component.form.username')}
						</Field.Label>
						<Field.Row>
							<TextInput
								{...register('username', {
									required: t('registration.component.form.requiredField'),
								})}
								error={errors?.username?.message}
								aria-required='true'
								aria-invalid={errors.username ? 'true' : 'false'}
								aria-describedby={`${usernameId}-error`}
								id={usernameId}
								placeholder='jon.doe'
							/>
						</Field.Row>
						{errors.username && (
							<Field.Error aria-live='assertive' id={`${usernameId}-error`}>
								{errors.username.message}
							</Field.Error>
						)}
					</Field>
					<Field>
						<Field.Label required htmlFor={passwordId}>
							{t('registration.component.form.password')}
						</Field.Label>
						<Field.Row>
							<PasswordInput
								{...register('password', {
									required: t('registration.component.form.requiredField'),
									validate: () => (!passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
								})}
								error={errors.password?.message}
								aria-required='true'
								aria-invalid={errors.password ? 'true' : undefined}
								id={passwordId}
								placeholder={passwordPlaceholder || t('Create_a_password')}
								aria-describedby={`${passwordVerifierId} ${passwordId}-error`}
							/>
						</Field.Row>
						{errors?.password && (
							<Field.Error aria-live='assertive' id={`${passwordId}-error`}>
								{errors.password.message}
							</Field.Error>
						)}
						<PasswordVerifier password={password} id={passwordVerifierId} />
					</Field>
					{requiresPasswordConfirmation && (
						<Field>
							<Field.Label required htmlFor={passwordConfirmationId}>
								{t('registration.component.form.confirmPassword')}
							</Field.Label>
							<Field.Row>
								<PasswordInput
									{...register('passwordConfirmation', {
										required: t('registration.component.form.requiredField'),
										deps: ['password'],
										validate: (val: string) => (watch('password') === val ? true : t('registration.component.form.invalidConfirmPass')),
									})}
									error={errors.passwordConfirmation?.message}
									aria-required='true'
									aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
									id={passwordConfirmationId}
									aria-describedby={`${passwordConfirmationId}-error`}
									placeholder={passwordConfirmationPlaceholder || t('Confirm_password')}
									disabled={!passwordIsValid}
								/>
							</Field.Row>
							{errors.passwordConfirmation && (
								<Field.Error aria-live='assertive' id={`${passwordConfirmationId}-error`}>
									{errors.passwordConfirmation.message}
								</Field.Error>
							)}
						</Field>
					)}
					{manuallyApproveNewUsersRequired && (
						<Field>
							<Field.Label required htmlFor={reasonId}>
								{t('registration.component.form.reasonToJoin')}
							</Field.Label>
							<Field.Row>
								<TextAreaInput
									{...register('reason', {
										required: t('registration.component.form.requiredField'),
									})}
									error={errors?.reason?.message}
									aria-required='true'
									aria-invalid={errors.reason ? 'true' : 'false'}
									aria-describedby={`${reasonId}-error`}
									id={reasonId}
								/>
							</Field.Row>
							{errors.reason && (
								<Field.Error aria-live='assertive' id={`${reasonId}-error`}>
									{errors.reason.message}
								</Field.Error>
							)}
						</Field>
					)}
					<CustomFieldsForm formName='customFields' formControl={control} metadata={customFields} />
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

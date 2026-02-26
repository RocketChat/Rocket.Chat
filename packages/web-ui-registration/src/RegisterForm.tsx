/* eslint-disable complexity */
import {
	FieldGroup,
	TextInput,
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	PasswordInput,
	ButtonGroup,
	Button,
	TextAreaInput,
	Callout,
	Box,
	Icon,
} from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useAccountsCustomFields, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
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

	const requireNameForRegister = useSetting('Accounts_RequireNameForSignUp', true);
	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation', true);
	const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers', false);

	const usernameOrEmailPlaceholder = useSetting('Accounts_EmailOrUsernamePlaceholder', '');
	const passwordPlaceholder = useSetting('Accounts_PasswordPlaceholder', '');
	const passwordConfirmationPlaceholder = useSetting('Accounts_ConfirmPasswordPlaceholder', '');

	const formLabelId = useId();
	const passwordVerifierId = useId();
	const nameId = useId();
	const emailId = useId();
	const usernameId = useId();
	const passwordId = useId();
	const passwordConfirmationId = useId();
	const reasonId = useId();

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

	const { password = '' } = watch();

	const passwordValidations = [
		{
			id: 'length',
			isValid: password.length >= 14,
			text: 'At least 14 characters',
		},
		{
			id: 'uppercase',
			isValid: /[A-Z]/.test(password),
			text: /[A-Z]/.test(password) ? 'Contains uppercase' : 'Missing uppercase letter',
		},
		{
			id: 'lowercase',
			isValid: /[a-z]/.test(password),
			text: /[a-z]/.test(password) ? 'Contains lowercase' : 'Missing lowercase letter',
		},
		{
			id: 'number',
			isValid: /[0-9]/.test(password),
			text: /[0-9]/.test(password) ? 'Contains number' : 'Missing number',
		},
		{
			id: 'symbol',
			isValid: /[^A-Za-z0-9]/.test(password),
			text: /[^A-Za-z0-9]/.test(password) ? 'Contains symbol' : 'Missing symbol',
		},
		{
			id: 'repeating',
			isValid: !/(.)\1{3,}/.test(password),
			text: !/(.)\1{3,}/.test(password) ? 'No excessive repeating characters' : 'Excessive repeating characters',
		},
	];

	const passwordIsValid = password.length > 0 && passwordValidations.every((v) => v.isValid);

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
					if (error.errorType === 'error-invalid-domain') {
						setError('email', { type: 'invalid-domain', message: t('registration.component.form.invalidEmailDomain') });
					}
					if (/Email already exists/.test(error.error)) {
						setError('email', { type: 'email-already-exists', message: t('registration.component.form.emailAlreadyInUse') });
					}
					if (/Username is already in use/.test(error.error)) {
						setError('username', { type: 'username-already-exists', message: t('registration.component.form.usernameAlreadyInUse') });
					}
					if (/The username provided is not valid/.test(error.error)) {
						setError('username', {
							type: 'username-contains-invalid-chars',
							message: t('registration.component.form.usernameContainsInvalidChars'),
						});
					}
					if (/Name contains invalid characters/.test(error.error)) {
						setError('name', { type: 'name-contains-invalid-chars', message: t('registration.component.form.nameContainsInvalidChars') });
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
						<FieldLabel required={requireNameForRegister} htmlFor={nameId}>
							{t('registration.component.form.name')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('name', {
									required: requireNameForRegister ? t('Required_field', { field: t('registration.component.form.name') }) : false,
								})}
								error={errors?.name?.message}
								aria-required={requireNameForRegister}
								aria-invalid={errors.name ? 'true' : 'false'}
								placeholder={t('onboarding.form.adminInfoForm.fields.fullName.placeholder')}
								aria-describedby={`${nameId}-error`}
								id={nameId}
							/>
						</FieldRow>
						{errors.name && (
							<FieldError role='alert' id={`${nameId}-error`}>
								{errors.name.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={emailId}>
							{t('registration.component.form.email')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('email', {
									required: t('Required_field', { field: t('registration.component.form.email') }),
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
						</FieldRow>
						{errors.email && (
							<FieldError role='alert' id={`${emailId}-error`}>
								{errors.email.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={usernameId}>
							{t('registration.component.form.username')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('username', {
									required: t('Required_field', { field: t('registration.component.form.username') }),
								})}
								error={errors?.username?.message}
								aria-required='true'
								aria-invalid={errors.username ? 'true' : 'false'}
								aria-describedby={`${usernameId}-error`}
								id={usernameId}
								placeholder='jon.doe'
							/>
						</FieldRow>
						{errors.username && (
							<FieldError role='alert' id={`${usernameId}-error`}>
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
									required: true,
									validate: () => passwordIsValid,
								})}
								aria-required='true'
								aria-invalid={!passwordIsValid ? 'true' : 'false'}
								id={passwordId}
								placeholder={passwordPlaceholder || t('Create_a_password')}
								aria-describedby={passwordVerifierId}
							/>
						</FieldRow>
						<Box display='flex' flexDirection='column' mbs={8} role='list' aria-live='polite' id={passwordVerifierId}>
							{passwordValidations.map((validation) => (
								<Box
									key={validation.id}
									display='flex'
									alignItems='center'
									mbe={8}
									fontScale='c1'
									color={validation.isValid ? 'status-font-on-success' : 'status-font-on-danger'}
									role='listitem'
								>
									<Icon
										name={validation.isValid ? 'success-circle' : 'error-circle'}
										size='x16'
										mie={4}
									/>
									<span>{validation.text}</span>
								</Box>
							))}
						</Box>
					</Field>
					{requiresPasswordConfirmation && (
						<Field>
							<FieldLabel required htmlFor={passwordConfirmationId}>
								{t('registration.component.form.confirmPassword')}
							</FieldLabel>
							<FieldRow>
								<PasswordInput
									{...register('passwordConfirmation', {
										required: t('Required_field', { field: t('registration.component.form.confirmPassword') }),
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
							</FieldRow>
							{errors.passwordConfirmation && (
								<FieldError role='alert' id={`${passwordConfirmationId}-error`}>
									{errors.passwordConfirmation.message}
								</FieldError>
							)}
						</Field>
					)}
					{manuallyApproveNewUsersRequired && (
						<Field>
							<FieldLabel required htmlFor={reasonId}>
								{t('registration.component.form.reasonToJoin')}
							</FieldLabel>
							<FieldRow>
								<TextAreaInput
									{...register('reason', {
										required: t('Required_field', { field: t('registration.component.form.reasonToJoin') }),
									})}
									error={errors?.reason?.message}
									aria-required='true'
									aria-invalid={errors.reason ? 'true' : 'false'}
									aria-describedby={`${reasonId}-error`}
									id={reasonId}
								/>
							</FieldRow>
							{errors.reason && (
								<FieldError role='alert' id={`${reasonId}-error`}>
									{errors.reason.message}
								</FieldError>
							)}
						</Field>
					)}
					<CustomFieldsForm formName='customFields' formControl={control} metadata={customFields} />
					{serverError && <Callout type='danger'>{serverError}</Callout>}
				</FieldGroup>
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' loading={registerUser.isPending} primary>
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

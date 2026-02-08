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
} from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { CustomFieldsForm, PasswordVerifier } from '@rocket.chat/ui-client';
import { useAccountsCustomFields, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import EmailConfirmationForm from './EmailConfirmationForm';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useRegisterMethod } from './hooks/useRegisterMethod';
import { useRegisterValidation } from './hooks/useRegisterValidation';
import { useRegisterErrorHandling } from './hooks/useRegisterErrorHandling';

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

	// Settings
	const requireNameForRegister = useSetting('Accounts_RequireNameForSignUp', true);
	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation', true);
	const manuallyApproveNewUsersRequired = useSetting('Accounts_ManuallyApproveNewUsers', false);

	const usernameOrEmailPlaceholder = useSetting('Accounts_EmailOrUsernamePlaceholder', '');
	const passwordPlaceholder = useSetting('Accounts_PasswordPlaceholder', '');
	const passwordConfirmationPlaceholder = useSetting('Accounts_ConfirmPasswordPlaceholder', '');

	// IDs
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

	
	const validation = useRegisterValidation({
		requireNameForRegister,
		requiresPasswordConfirmation,
		password,
	});

	
	const handleRegisterError = useRegisterErrorHandling({
		setError,
		setLoginRoute,
		setServerError,
	});

	const registerFormRef = useRef<HTMLElement>(null);

	useEffect(() => {
		registerFormRef.current?.focus();
	}, []);

	const handleRegister = async ({ password, passwordConfirmation: _, ...formData }: LoginRegisterPayload) => {
		registerUser.mutate(
			{ pass: password, ...formData },
			{
				onError: handleRegisterError,
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
					{/* Name */}
					<Field>
						<FieldLabel required={requireNameForRegister} htmlFor={nameId}>
							{t('registration.component.form.name')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('name', validation.name)}
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

					{/* Email */}
					<Field>
						<FieldLabel required htmlFor={emailId}>
							{t('registration.component.form.email')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('email', validation.email)}
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

					{/* Username */}
					<Field>
						<FieldLabel required htmlFor={usernameId}>
							{t('registration.component.form.username')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('username', validation.username)}
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

					{/* Password */}
					<Field>
						<FieldLabel required htmlFor={passwordId}>
							{t('registration.component.form.password')}
						</FieldLabel>
						<FieldRow>
							<PasswordInput
								{...register('password', validation.password)}
								error={errors.password?.message}
								aria-required='true'
								aria-invalid={errors.password ? 'true' : undefined}
								id={passwordId}
								placeholder={passwordPlaceholder || t('Create_a_password')}
								aria-describedby={`${passwordVerifierId} ${passwordId}-error`}
							/>
						</FieldRow>
						{errors.password && (
							<FieldError role='alert' id={`${passwordId}-error`}>
								{errors.password.message}
							</FieldError>
						)}
						<PasswordVerifier password={password} id={passwordVerifierId} />
					</Field>

					{/* Confirm Password */}
					{requiresPasswordConfirmation && (
						<Field>
							<FieldLabel required htmlFor={passwordConfirmationId}>
								{t('registration.component.form.confirmPassword')}
							</FieldLabel>
							<FieldRow>
								<PasswordInput
									{...register('passwordConfirmation', validation.passwordConfirmation)}
									error={errors.passwordConfirmation?.message}
									aria-required='true'
									aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
									id={passwordConfirmationId}
									aria-describedby={`${passwordConfirmationId}-error`}
									placeholder={passwordConfirmationPlaceholder || t('Confirm_password')}
								/>
							</FieldRow>
							{errors.passwordConfirmation && (
								<FieldError role='alert' id={`${passwordConfirmationId}-error`}>
									{errors.passwordConfirmation.message}
								</FieldError>
							)}
						</Field>
					)}

					{/* Reason */}
					{manuallyApproveNewUsersRequired && (
						<Field>
							<FieldLabel required htmlFor={reasonId}>
								{t('registration.component.form.reasonToJoin')}
							</FieldLabel>
							<FieldRow>
								<TextAreaInput
									{...register('reason', validation.reason)}
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
				<ActionLink onClick={() => setLoginRoute('login')}>
					<Trans i18nKey='registration.page.register.back'>Back to Login</Trans>
				</ActionLink>
			</Form.Footer>
		</Form>
	);
};

export default RegisterForm;

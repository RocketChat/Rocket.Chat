import {
	FieldGroup,
	TextInput,
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
import { FormField } from './components/FormField';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useRegisterMethod } from './hooks/useRegisterMethod';
import { useRegistrationValidation } from './hooks/useRegistrationValidation';
import { useRegistrationErrors } from './hooks/useRegistrationErrors';

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
	const {
		getNameValidation,
		getEmailValidation,
		getUsernameValidation,
		getPasswordValidation,
		getPasswordConfirmationValidation,
		getReasonValidation,
		passwordIsValid,
	} = useRegistrationValidation(password);

	const { handleRegistrationError } = useRegistrationErrors(setError, setLoginRoute, setServerError);

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
				onError: handleRegistrationError,
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
					<FormField
						label={t('registration.component.form.name')}
						required={requireNameForRegister}
						htmlFor={nameId}
						error={errors?.name?.message}
						errorId={`${nameId}-error`}
					>
						<TextInput
							{...register('name', getNameValidation())}
							error={errors?.name?.message}
							aria-required={requireNameForRegister}
							aria-invalid={errors.name ? 'true' : 'false'}
							placeholder={t('onboarding.form.adminInfoForm.fields.fullName.placeholder')}
							aria-describedby={`${nameId}-error`}
							id={nameId}
						/>
					</FormField>

					<FormField
						label={t('registration.component.form.email')}
						required
						htmlFor={emailId}
						error={errors?.email?.message}
						errorId={`${emailId}-error`}
					>
						<TextInput
							{...register('email', getEmailValidation())}
							placeholder={usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder')}
							error={errors?.email?.message}
							aria-required='true'
							aria-invalid={errors.email ? 'true' : 'false'}
							aria-describedby={`${emailId}-error`}
							id={emailId}
						/>
					</FormField>

					<FormField
						label={t('registration.component.form.username')}
						required
						htmlFor={usernameId}
						error={errors?.username?.message}
						errorId={`${usernameId}-error`}
					>
						<TextInput
							{...register('username', getUsernameValidation())}
							error={errors?.username?.message}
							aria-required='true'
							aria-invalid={errors.username ? 'true' : 'false'}
							aria-describedby={`${usernameId}-error`}
							id={usernameId}
							placeholder='jon.doe'
						/>
					</FormField>

					<FormField
						label={t('registration.component.form.password')}
						required
						htmlFor={passwordId}
						error={errors?.password?.message}
						errorId={`${passwordId}-error`}
					>
						<PasswordInput
							{...register('password', getPasswordValidation())}
							error={errors.password?.message}
							aria-required='true'
							aria-invalid={errors.password ? 'true' : undefined}
							id={passwordId}
							placeholder={passwordPlaceholder || t('Create_a_password')}
							aria-describedby={`${passwordVerifierId} ${passwordId}-error`}
						/>
						<PasswordVerifier password={password} id={passwordVerifierId} />
					</FormField>

					{requiresPasswordConfirmation && (
						<FormField
							label={t('registration.component.form.confirmPassword')}
							required
							htmlFor={passwordConfirmationId}
							error={errors?.passwordConfirmation?.message}
							errorId={`${passwordConfirmationId}-error`}
						>
							<PasswordInput
								{...register('passwordConfirmation', getPasswordConfirmationValidation(watch('password')))}
								error={errors.passwordConfirmation?.message}
								aria-required='true'
								aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
								id={passwordConfirmationId}
								aria-describedby={`${passwordConfirmationId}-error`}
								placeholder={passwordConfirmationPlaceholder || t('Confirm_password')}
								disabled={!passwordIsValid}
							/>
						</FormField>
					)}

					{manuallyApproveNewUsersRequired && (
						<FormField
							label={t('registration.component.form.reasonToJoin')}
							required
							htmlFor={reasonId}
							error={errors?.reason?.message}
							errorId={`${reasonId}-error`}
						>
							<TextAreaInput
								{...register('reason', getReasonValidation())}
								error={errors?.reason?.message}
								aria-required='true'
								aria-invalid={errors.reason ? 'true' : 'false'}
								aria-describedby={`${reasonId}-error`}
								id={reasonId}
							/>
						</FormField>
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

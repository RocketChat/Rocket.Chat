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
	Select,
} from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { CustomFieldsForm, PasswordVerifier, useValidatePassword } from '@rocket.chat/ui-client';
import { useAccountsCustomFields, useSetting, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import EmailConfirmationForm from './EmailConfirmationForm';
import PhoneNumberInput from './components/PhoneNumberInput/PhoneNumberInput';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useRegisterMethod } from './hooks/useRegisterMethod';

export type LoginRegisterPayload = {
	name: string;
	passwordConfirmation: string;
	username: string;
	password: string;
	email: string;
	reason: string;
	pharmacyId?: string;
	phoneNumber?: string;
};

type RegisterFormProps = {
	setLoginRoute: DispatchLoginRouter;
	initialValues?: Partial<LoginRegisterPayload>;
	onSubmit?: (payload: {
		name: string;
		email: string;
		username: string;
		pass: string;
		reason: string;
		pharmacyId?: string;
		phone?: string;
	}) => Promise<void> | void;
	submitLabel?: string;
	hideBackLink?: boolean;
	disablePharmacySelection?: boolean;
};

export const RegisterForm = ({
	setLoginRoute,
	initialValues,
	onSubmit,
	submitLabel,
	hideBackLink = false,
	disablePharmacySelection = false,
}: RegisterFormProps): ReactElement => {
	const { t } = useTranslation();

	const requireNameForRegister = useSetting('Accounts_RequireNameForSignUp', true);
	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation', true);

	const usernameOrEmailPlaceholder = useSetting('Accounts_EmailOrUsernamePlaceholder', '');
	const passwordPlaceholder = useSetting('Accounts_PasswordPlaceholder', '');
	const passwordConfirmationPlaceholder = useSetting('Accounts_ConfirmPasswordPlaceholder', '');

	const formLabelId = useId();
	const passwordVerifierId = useId();
	const nameId = useId();
	const emailId = useId();
	const phoneNumberId = useId();
	const usernameId = useId();
	const passwordId = useId();
	const passwordConfirmationId = useId();
	const reasonId = useId();

	const registerUser = useRegisterMethod();
	const customFields = useAccountsCustomFields();

	const [serverError, setServerError] = useState<string | undefined>(undefined);
	const [isPhoneValid, setIsPhoneValid] = useState(true);
	const [isCustomSubmitting, setIsCustomSubmitting] = useState(false);

	const dispatchToastMessage = useToastMessageDispatch();

	const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list.public');
	const { data: pharmacyData } = useQuery({
		queryKey: ['public-pharmacies'],
		queryFn: async () => getPharmacies(),
	});

	const pharmacyOptions = useMemo(
		// @ts-ignore
		// @ts-ignore
		() => (pharmacyData?.pharmacies?.map((p: any) => [String(p._id), p.name]) || []) as [string, string][],
		[pharmacyData],
	);

	const {
		register,
		handleSubmit,
		setError,
		watch,
		getValues,
		clearErrors,
		control,
		setValue,
		formState: { errors },
	} = useForm<LoginRegisterPayload>({
		mode: 'onBlur',
		defaultValues: initialValues,
	});

	const { password } = watch();
	const passwordIsValid = useValidatePassword(password);
	const registerFormRef = useRef<HTMLElement>(null);

	const applyKnownFormErrors = (error: any): boolean => {
		if ([error?.error, error?.errorType].includes('error-invalid-email')) {
			setError('email', { type: 'invalid-email', message: t('registration.component.form.invalidEmail') });
			return true;
		}
		if (error?.errorType === 'error-user-already-exists') {
			setError('username', { type: 'user-already-exists', message: t('registration.component.form.usernameAlreadyExists') });
			return true;
		}
		if (/Email already exists/.test(error?.error || '')) {
			setError('email', { type: 'email-already-exists', message: t('registration.component.form.emailAlreadyExists') });
			return true;
		}
		if (/Username is already in use/.test(error?.error || '')) {
			setError('username', { type: 'username-already-exists', message: t('registration.component.form.userAlreadyExist') });
			return true;
		}
		if (/The username provided is not valid/.test(error?.error || '')) {
			setError('username', {
				type: 'username-contains-invalid-chars',
				message: t('registration.component.form.usernameContainsInvalidChars'),
			});
			return true;
		}
		if (/Name contains invalid characters/.test(error?.error || '')) {
			setError('name', { type: 'name-contains-invalid-chars', message: t('registration.component.form.nameContainsInvalidChars') });
			return true;
		}
		if (/error-too-many-requests/.test(error?.error || '')) {
			dispatchToastMessage({ type: 'error', message: error.error });
			return true;
		}
		if (/error-user-is-not-activated/.test(error?.error || '')) {
			dispatchToastMessage({ type: 'info', message: t('registration.page.registration.waitActivationWarning') });
			setLoginRoute('login');
			return true;
		}
		if (error?.error === 'error-user-registration-custom-field') {
			setServerError(error.message);
			return true;
		}
		if (['error-invalid-phone', 'error-invalid-phone-number'].includes(error?.error)) {
			const phoneFormatHint = `${t('error-invalid-phone-number')} (Use +1234567890 or 1234567890)`;
			setError('phoneNumber', { type: 'invalid-phone', message: phoneFormatHint });
			return true;
		}
		return false;
	};

	useEffect(() => {
		if (registerFormRef.current) {
			registerFormRef.current.focus();
		}
	}, []);

	useEffect(() => {
		if (!initialValues) {
			return;
		}
		const entries = Object.entries(initialValues) as Array<[keyof LoginRegisterPayload, string | undefined]>;
		for (const [key, value] of entries) {
			if (value !== undefined && value !== null) {
				setValue(key, value as any);
			}
		}
	}, [initialValues, setValue]);
	useEffect(() => {
		if (!initialValues?.pharmacyId) {
			return;
		}

		console.info('[Medsense][RegisterForm][PharmacyOptions]', {
			initialPharmacyId: initialValues.pharmacyId,
			optionIds: pharmacyOptions.map(([id]) => String(id)),
		});
	}, [initialValues?.pharmacyId, pharmacyOptions]);

	const handleRegister = async ({ password, passwordConfirmation: _, phoneNumber, ...formData }: LoginRegisterPayload) => {
		setServerError(undefined);
		const phoneFormatHint = `${t('error-invalid-phone-number')} (Use +1234567890 or 1234567890)`;
		if (!isPhoneValid) {
			setError('phoneNumber', { type: 'invalid-phone', message: phoneFormatHint });
			return;
		}

		const payload = { pass: password, ...formData } as any;
		if (phoneNumber) {
			payload.phone = phoneNumber;
		}

		if (onSubmit) {
			setIsCustomSubmitting(true);
			try {
				await onSubmit(payload);
			} catch (error: any) {
				const handled = applyKnownFormErrors(error);
				if (!handled) {
					const message = error?.error || error?.message || t('error-invalid-data');
					setServerError(String(message));
				}
			} finally {
				setIsCustomSubmitting(false);
			}
			return;
		}

		registerUser.mutate(payload, {
			onError: (error: any) => {
				applyKnownFormErrors(error);
			},
		});
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
						<FieldLabel required htmlFor={phoneNumberId}>
							{t('Phone_number')}
						</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='phoneNumber'
								rules={{ required: t('Required_field', { field: t('Phone_number') }) }}
								render={({ field }) => (
									<PhoneNumberInput
										{...field}
										value={field.value ?? ''}
										error={errors.phoneNumber?.message}
										onValidityChange={(isValid) => {
											setIsPhoneValid(isValid);
											if (isValid) {
												clearErrors('phoneNumber');
											}
										}}
										name='phoneNumber'
										id='phoneNumberInput'
									/>
								)}
							/>
						</FieldRow>
						{errors.phoneNumber && (
							<FieldError role='alert' id={`${phoneNumberId}-error`}>
								{errors.phoneNumber.message}
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
									required: t('Required_field', { field: t('registration.component.form.password') }),
									validate: () => (!passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
								})}
								error={errors.password?.message}
								aria-required='true'
								aria-invalid={errors.password ? 'true' : undefined}
								id={passwordId}
								placeholder={passwordPlaceholder || t('Create_a_password')}
								aria-describedby={`${passwordVerifierId} ${passwordId}-error`}
							/>
						</FieldRow>
						{errors?.password && (
							<FieldError role='alert' id={`${passwordId}-error`}>
								{errors.password.message}
							</FieldError>
						)}
						<PasswordVerifier password={password} id={passwordVerifierId} />
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

					<Field>
						<FieldLabel htmlFor='pharmacyId'>{t('Preferred_Pharmacy')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='pharmacyId'
								render={({ field }) => (
									<Select
										id='pharmacyId'
										placeholder={t('Select_an_option')}
										options={pharmacyOptions}
										value={field.value || ''}
										onChange={(val) => {
											if (val === undefined || val === null) {
												return;
											}
											field.onChange(String(val));
										}}
										disabled={disablePharmacySelection}
									/>
								)}
							/>
						</FieldRow>
					</Field>

					<CustomFieldsForm formName='customFields' formControl={control} metadata={customFields} />
					{serverError && <Callout type='danger'>{serverError}</Callout>}
				</FieldGroup>
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' loading={onSubmit ? isCustomSubmitting : registerUser.isPending} primary>
						{submitLabel || t('registration.component.form.joinYourTeam')}
					</Button>
				</ButtonGroup>
				{!hideBackLink && (
					<ActionLink
						onClick={(): void => {
							setLoginRoute('login');
						}}
					>
						<Trans i18nKey='registration.page.register.back'>Back to Login</Trans>
					</ActionLink>
				)}
			</Form.Footer>
		</Form>
	);
};

export default RegisterForm;

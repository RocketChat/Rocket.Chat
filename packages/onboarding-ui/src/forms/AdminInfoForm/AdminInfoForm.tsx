import {
	EmailInput,
	FieldGroup,
	Field,
	ButtonGroup,
	Button,
	PasswordInput,
	TextInput,
	Box,
	CheckBox,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
} from '@rocket.chat/fuselage';
import { Form, FormContainer, FormFooter, FormHeader, FormSteps, FormSubtitle, FormTitle } from '@rocket.chat/layout';
import { useRef, useEffect, useId } from 'react';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type AdminInfoPayload = {
	fullname: string;
	username: string;
	email: string;
	password: string;
	keepPosted?: boolean;
};

type AdminInfoFormProps = {
	currentStep: number;
	stepCount: number;
	passwordRulesHint: string;
	keepPosted?: boolean;
	initialValues?: Omit<AdminInfoPayload, 'password'>;
	validateUsername: Validate<FieldPathValue<AdminInfoPayload, 'username'>, AdminInfoPayload>;
	validateEmail: Validate<FieldPathValue<AdminInfoPayload, 'email'>, AdminInfoPayload>;
	validatePassword: Validate<FieldPathValue<AdminInfoPayload, 'password'>, AdminInfoPayload>;
	onSubmit: SubmitHandler<AdminInfoPayload>;
};

const AdminInfoForm = ({
	currentStep,
	stepCount,
	passwordRulesHint,
	initialValues,
	validateUsername,
	validateEmail,
	validatePassword,
	keepPosted = false,
	onSubmit,
}: AdminInfoFormProps) => {
	const { t } = useTranslation();

	const formId = useId();
	const fullnameField = useId();
	const usernameField = useId(); // lgtm [js/insecure-randomness]
	const emailField = useId();
	const passwordField = useId(); // lgtm [js/insecure-randomness]

	const adminInfoFormRef = useRef<HTMLElement>(null);

	const {
		register,
		handleSubmit,
		formState: { isValidating, isSubmitting, errors },
		control,
	} = useForm<AdminInfoPayload>({
		defaultValues: {
			...initialValues,
			password: '',
		},
		mode: 'onBlur',
	});

	useEffect(() => {
		if (adminInfoFormRef.current) {
			adminInfoFormRef.current.focus();
		}
	}, []);

	return (
		<Form
			ref={adminInfoFormRef}
			tabIndex={-1}
			aria-labelledby={`${formId}-title`}
			aria-describedby={`${formId}-description`}
			onSubmit={handleSubmit(onSubmit)}
		>
			<FormHeader>
				<FormSteps currentStep={currentStep} stepCount={stepCount} />
				<FormTitle id={`${formId}-title`}>{t('form.adminInfoForm.title')}</FormTitle>
				<FormSubtitle id={`${formId}-description`}>{t('form.adminInfoForm.subtitle')}</FormSubtitle>
			</FormHeader>
			<FormContainer>
				<FieldGroup>
					<Field>
						<FieldLabel required htmlFor={fullnameField}>
							{t('form.adminInfoForm.fields.fullName.label')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='fullname'
								control={control}
								rules={{ required: t('component.form.requiredField') }}
								render={({ field }) => (
									<TextInput
										{...field}
										aria-describedby={`${fullnameField}-error}`}
										aria-required='true'
										aria-invalid={Boolean(errors.fullname)}
										placeholder={t('form.adminInfoForm.fields.fullName.placeholder')}
										id={fullnameField}
									/>
								)}
							/>
						</FieldRow>
						{errors.fullname && (
							<FieldError aria-live='assertive' id={`${fullnameField}-error}`}>
								{errors.fullname.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={usernameField}>
							{t('form.adminInfoForm.fields.username.label')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='username'
								control={control}
								rules={{
									required: t('component.form.requiredField'),
									validate: validateUsername,
								}}
								render={({ field }) => (
									<TextInput
										{...field}
										aria-describedby={`${usernameField}-error}`}
										aria-required='true'
										aria-invalid={Boolean(errors.username)}
										placeholder={t('form.adminInfoForm.fields.username.placeholder')}
										id={usernameField}
									/>
								)}
							/>
						</FieldRow>
						{errors.username && (
							<FieldError aria-live='assertive' id={`${usernameField}-error}`}>
								{errors.username.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={emailField}>
							{t('form.adminInfoForm.fields.email.label')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='email'
								control={control}
								rules={{
									required: t('component.form.requiredField'),
									validate: validateEmail,
								}}
								render={({ field }) => (
									<EmailInput
										{...field}
										aria-required='true'
										aria-invalid={Boolean(errors.email)}
										aria-describedby={`${emailField}-error}`}
										placeholder={t('form.adminInfoForm.fields.email.placeholder')}
										id={emailField}
									/>
								)}
							/>
						</FieldRow>
						{errors.email && (
							<FieldError aria-live='assertive' id={`${emailField}-error}`}>
								{errors.email.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={passwordField}>
							{t('form.adminInfoForm.fields.password.label')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='password'
								control={control}
								rules={{
									required: t('component.form.requiredField'),
									validate: validatePassword,
								}}
								render={({ field }) => (
									<PasswordInput
										{...field}
										aria-required='true'
										aria-invalid={Boolean(errors.password)}
										aria-describedby={`${passwordField}-hint ${passwordField}-error}`}
										placeholder={t('form.adminInfoForm.fields.password.placeholder')}
										id={passwordField}
									/>
								)}
							/>
						</FieldRow>
						<FieldHint id={`${passwordField}-hint`}>{passwordRulesHint}</FieldHint>
						{errors.password && (
							<FieldError aria-live='assertive' id={`${passwordField}-error}`}>
								{errors.password.message}
							</FieldError>
						)}
					</Field>
					{keepPosted && (
						<Box marginBlockEnd={8} display='block' color='info' fontScale='c1'>
							<CheckBox id='keepPosted' marginInlineEnd={8} {...register('keepPosted')} />
							<label htmlFor='keepPosted'>{t('form.adminInfoForm.fields.keepPosted.label')}</label>
						</Box>
					)}
				</FieldGroup>
			</FormContainer>
			<FormFooter>
				<ButtonGroup>
					<Button type='submit' primary loading={isValidating || isSubmitting}>
						{t('component.form.action.next')}
					</Button>
				</ButtonGroup>
			</FormFooter>
		</Form>
	);
};

export default AdminInfoForm;

import { FieldGroup, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useAccountsCustomFields, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import EmailConfirmationForm from './EmailConfirmationForm';
import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useRegisterMethod } from './hooks/useRegisterMethod';
import { useRegisterFormValidation } from './hooks/useRegisterFormValidation';
import { useRegisterErrorHandler } from './hooks/useRegisterErrorHandler';
import { FormFieldInput } from './components/FormFieldInput';
import { PasswordFieldWithVerifier } from './components/PasswordFieldWithVerifier';

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

	const { validationRules, requireNameForRegister, requiresPasswordConfirmation, manuallyApproveNewUsersRequired, passwordIsValid } =
		useRegisterFormValidation(watch);

	const { handleRegisterError } = useRegisterErrorHandler(setError, setServerError, setLoginRoute);

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
					<FormFieldInput
						label={t('registration.component.form.name')}
						fieldId={nameId}
						required={requireNameForRegister}
						error={errors.name}
						placeholder={t('onboarding.form.adminInfoForm.fields.fullName.placeholder')}
						register={register('name', validationRules.name)}
					/>
					<FormFieldInput
						label={t('registration.component.form.email')}
						fieldId={emailId}
						required
						error={errors.email}
						placeholder={usernameOrEmailPlaceholder || t('registration.component.form.emailPlaceholder')}
						register={register('email', validationRules.email)}
					/>
					<FormFieldInput
						label={t('registration.component.form.username')}
						fieldId={usernameId}
						required
						error={errors.username}
						placeholder='jon.doe'
						register={register('username', validationRules.username)}
					/>
					<PasswordFieldWithVerifier
						passwordId={passwordId}
						passwordVerifierId={passwordVerifierId}
						passwordConfirmationId={passwordConfirmationId}
						passwordError={errors.password}
						passwordConfirmationError={errors.passwordConfirmation}
						passwordRegister={register('password', validationRules.password)}
						passwordConfirmationRegister={
							requiresPasswordConfirmation ? register('passwordConfirmation', validationRules.passwordConfirmation) : undefined
						}
						password={watch('password')}
						passwordIsValid={passwordIsValid}
						requiresPasswordConfirmation={requiresPasswordConfirmation}
						passwordPlaceholder={passwordPlaceholder}
						passwordConfirmationPlaceholder={passwordConfirmationPlaceholder}
					/>
					{manuallyApproveNewUsersRequired && (
						<FormFieldInput
							label={t('registration.component.form.reasonToJoin')}
							fieldId={reasonId}
							required
							error={errors.reason}
							register={register('reason', validationRules.reason)}
							type='textarea'
						/>
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

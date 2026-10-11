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
} from '@rocket.chat/fuselage';
import { Form, FormContainer, FormFooter } from '@rocket.chat/layout';
import { useEffect } from 'react';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

export type NewAccountPayload = {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	agreement?: boolean;
};

type NewAccountFormProps = {
	initialValues?: Omit<NewAccountPayload, 'password'>;
	validateEmail: Validate<FieldPathValue<NewAccountPayload, 'email'>, NewAccountPayload>;
	validatePassword: Validate<FieldPathValue<NewAccountPayload, 'password'>, NewAccountPayload>;
	validateConfirmationPassword: Validate<FieldPathValue<NewAccountPayload, 'confirmPassword'>, NewAccountPayload>;
	onSubmit: SubmitHandler<NewAccountPayload>;
};

const NewAccountForm = ({ validateEmail, validatePassword, validateConfirmationPassword, onSubmit }: NewAccountFormProps) => {
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { isValidating, isSubmitting, isValid, errors },
		setFocus,
	} = useForm<NewAccountPayload>({ mode: 'onChange' });

	useEffect(() => {
		setFocus('name');
	}, [setFocus]);

	return (
		<Form onSubmit={handleSubmit(onSubmit)}>
			<FormContainer>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('form.newAccountForm.fields.name.label')}</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('name', {
									required: t('component.form.requiredField'),
								})}
							/>
						</FieldRow>
						{errors.name && <FieldError>{errors.name.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('form.newAccountForm.fields.email.label')}</FieldLabel>
						<FieldRow>
							<EmailInput
								{...register('email', {
									validate: validateEmail,
									required: true,
								})}
							/>
						</FieldRow>
						{errors?.email && <FieldError>{errors.email.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('form.newAccountForm.fields.password.label')}</FieldLabel>
						<FieldRow>
							<PasswordInput
								{...register('password', {
									required: true,
									validate: validatePassword,
								})}
							/>
						</FieldRow>
						{errors.password && <FieldError>{errors.password.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('form.newAccountForm.fields.confirmPassword.label')}</FieldLabel>
						<FieldRow>
							<PasswordInput
								{...register('confirmPassword', {
									required: true,
									validate: validateConfirmationPassword,
								})}
							/>
						</FieldRow>
						{errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
					</Field>
					<Field>
						<FieldRow justifyContent='flex-start'>
							<CheckBox {...register('agreement', { required: true })} marginInlineEnd={8} />
							<Box is='label' htmlFor='agreement' withRichContent fontScale='c1'>
								<Trans i18nKey='component.form.termsAndConditions'>
									I agree with
									<a href='https://rocket.chat/terms' target='_blank' rel='noopener noreferrer'>
										Terms and Conditions
									</a>
									and
									<a href='https://rocket.chat/privacy' target='_blank' rel='noopener noreferrer'>
										Privacy Policy
									</a>
								</Trans>
							</Box>
						</FieldRow>
						{errors.agreement?.type === 'required' && <FieldError>{t('component.form.requiredField')}</FieldError>}
					</Field>
				</FieldGroup>
			</FormContainer>
			<FormFooter>
				<ButtonGroup>
					<Button type='submit' primary loading={isValidating || isSubmitting} disabled={!isValid}>
						{t('component.form.action.next')}
					</Button>
				</ButtonGroup>
			</FormFooter>
		</Form>
	);
};

export default NewAccountForm;

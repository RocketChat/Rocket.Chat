import { FieldGroup, Field, PasswordInput, ButtonGroup, Button, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { Form, FormContainer, FormFooter } from '@rocket.chat/layout';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type CreateNewPasswordPayload = {
	password: string;
	passwordConfirmation: string;
};

type CreateNewPasswordProps = {
	initialValues?: CreateNewPasswordPayload;
	validatePassword: Validate<FieldPathValue<CreateNewPasswordPayload, 'password'>, CreateNewPasswordPayload>;
	validatePasswordConfirmation: Validate<FieldPathValue<CreateNewPasswordPayload, 'passwordConfirmation'>, CreateNewPasswordPayload>;
	onSubmit: SubmitHandler<CreateNewPasswordPayload>;
};

const CreateNewPassword = ({ onSubmit, validatePassword, validatePasswordConfirmation, initialValues }: CreateNewPasswordProps) => {
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { isValidating, isSubmitting, isValid, errors },
	} = useForm<CreateNewPasswordPayload>({
		mode: 'onChange',
		defaultValues: {
			...initialValues,
		},
	});

	return (
		<Form onSubmit={handleSubmit(onSubmit)}>
			<FormContainer>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('form.createPasswordForm.fields.password.label')}</FieldLabel>
						<FieldRow>
							<PasswordInput
								{...register('password', {
									validate: validatePassword,
									required: true,
								})}
								placeholder={t('form.createPasswordForm.fields.password.placeholder')}
							/>
						</FieldRow>
						{errors.password && <FieldError>{errors.password.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('form.createPasswordForm.fields.confirmPassword.label')}</FieldLabel>
						<FieldRow>
							<PasswordInput
								{...register('passwordConfirmation', {
									validate: validatePasswordConfirmation,
									required: true,
								})}
								placeholder={t('form.createPasswordForm.fields.confirmPassword.placeholder')}
							/>
						</FieldRow>
						{errors.passwordConfirmation && <FieldError>{errors.passwordConfirmation.message}</FieldError>}
					</Field>
				</FieldGroup>
			</FormContainer>
			<FormFooter>
				<ButtonGroup>
					<Button type='submit' primary loading={isValidating || isSubmitting} disabled={!isValid}>
						{t('form.createPasswordForm.button.text')}
					</Button>
				</ButtonGroup>
			</FormFooter>
		</Form>
	);
};

export default CreateNewPassword;

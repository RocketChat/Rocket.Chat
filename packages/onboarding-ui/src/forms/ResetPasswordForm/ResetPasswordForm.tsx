import {
	FieldGroup,
	Field,
	EmailInput,
	ButtonGroup,
	Button,
	FieldLabel,
	FieldDescription,
	FieldRow,
	FieldError,
} from '@rocket.chat/fuselage';
import { Form, FormContainer, FormFooter } from '@rocket.chat/layout';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type ResetPasswordFormPayload = {
	email: string;
};

type ResetPasswordFormProps = {
	initialValues?: ResetPasswordFormPayload;
	validateEmail: Validate<FieldPathValue<ResetPasswordFormPayload, 'email'>, ResetPasswordFormPayload>;
	onSubmit: SubmitHandler<ResetPasswordFormPayload>;
};

const ResetPasswordForm = ({ onSubmit, validateEmail, initialValues }: ResetPasswordFormProps) => {
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { isValidating, isSubmitting, isValid, errors },
	} = useForm<ResetPasswordFormPayload>({
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
						<FieldLabel>{t('form.resetPasswordForm.fields.email.label')}</FieldLabel>
						<FieldDescription>{t('form.resetPasswordForm.content.subtitle')}</FieldDescription>
						<FieldRow>
							<EmailInput
								{...register('email', {
									validate: validateEmail,
									required: true,
								})}
								placeholder={t('form.resetPasswordForm.fields.email.placeholder')}
							/>
						</FieldRow>
						{errors.email && <FieldError>{errors.email.message}</FieldError>}
					</Field>
				</FieldGroup>
			</FormContainer>
			<FormFooter>
				<ButtonGroup>
					<Button type='submit' primary loading={isValidating || isSubmitting} disabled={!isValid}>
						{t('form.resetPasswordForm.action.submit')}
					</Button>
				</ButtonGroup>
			</FormFooter>
		</Form>
	);
};

export default ResetPasswordForm;

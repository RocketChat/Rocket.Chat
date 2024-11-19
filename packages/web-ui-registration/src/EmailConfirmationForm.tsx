import { FieldGroup, TextInput, Field, FieldLabel, FieldRow, FieldError, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useLoginSendEmailConfirmation } from './hooks/useLoginSendEmailConfirmation';

export const EmailConfirmationForm = ({ email, onBackToLogin }: { email?: string; onBackToLogin: () => void }): ReactElement => {
	const { t } = useTranslation();

	const basicEmailRegex = /^[^@]+@[^@]+$/;
	const isEmail = basicEmailRegex.test(email || '');

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<{
		email: string;
	}>({
		defaultValues: {
			email: isEmail ? email : '',
		},
	});

	const sendEmail = useLoginSendEmailConfirmation();

	return (
		<Form
			onSubmit={handleSubmit((data) => {
				if (sendEmail.isPending) {
					return;
				}
				sendEmail.mutate(data.email);
			})}
		>
			<Form.Header>
				<Form.Title>{t('registration.component.form.confirmation')}</Form.Title>
				<Form.Subtitle>{t('registration.page.emailVerification.subTitle')}</Form.Subtitle>
			</Form.Header>
			<Form.Container>
				<FieldGroup disabled={sendEmail.isPending || sendEmail.isSuccess}>
					<Field>
						<FieldLabel htmlFor='email'>{t('registration.component.form.email')}*</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('email', {
									required: true,
								})}
								error={errors.email && t('registration.component.form.requiredField')}
								aria-invalid={errors?.email?.type === 'required'}
								placeholder={t('registration.component.form.emailPlaceholder')}
								id='email'
							/>
						</FieldRow>
						{errors.email && <FieldError>{t('registration.component.form.requiredField')}</FieldError>}
					</Field>
				</FieldGroup>
				{sendEmail.isSuccess && (
					<FieldGroup>
						<Callout type='success'>{t('registration.page.emailVerification.sent')}</Callout>
					</FieldGroup>
				)}
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button loading={sendEmail.isPending} type='submit' primary>
						{t('registration.component.form.sendConfirmationEmail')}
					</Button>
				</ButtonGroup>

				<ActionLink
					onClick={(): void => {
						onBackToLogin();
					}}
				>
					{t('registration.page.register.back')}
				</ActionLink>
			</Form.Footer>
		</Form>
	);
};

export default EmailConfirmationForm;

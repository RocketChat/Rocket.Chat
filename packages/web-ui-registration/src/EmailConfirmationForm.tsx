import { FieldGroup, TextInput, Field, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useLoginSendEmailConfirmation } from './hooks/useLoginSendEmailConfirmation';

export const EmailConfirmationForm = ({ email, onBackToLogin }: { email?: string; onBackToLogin: () => void }): ReactElement => {
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<{
		email: string;
	}>({
		defaultValues: {
			email,
		},
	});

	const sendEmail = useLoginSendEmailConfirmation();

	return (
		<Form
			onSubmit={handleSubmit((data) => {
				if (sendEmail.isLoading) {
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
				<FieldGroup disabled={sendEmail.isLoading || sendEmail.isSuccess}>
					<Field>
						<Field.Label htmlFor='email'>{t('registration.component.form.email')}*</Field.Label>
						<Field.Row>
							<TextInput
								{...register('email', {
									required: true,
								})}
								disabled={Boolean(email)}
								error={errors.email && t('registration.component.form.requiredField')}
								aria-invalid={errors?.email?.type === 'required'}
								placeholder={t('registration.component.form.emailPlaceholder')}
								id='email'
							/>
						</Field.Row>
						{errors.email && <Field.Error>{t('registration.component.form.requiredField')}</Field.Error>}
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
					<Button disabled={sendEmail.isLoading} type='submit' primary>
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

import { FieldGroup, TextInput, Field, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useTranslation } from 'react-i18next';
import { useTranslation as useT } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { useLoginSendEmailConfirmation } from './hooks/useLoginSendEmailConfirmation';

export const EmailConfirmationForm = ({ email, onBackToLogin }: { email?: string; onBackToLogin: () => void }): ReactElement => {
	const { t } = useTranslation();
	const t1 = useT();

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
				sendEmail.mutate({ email: data.email });
			})}
		>
			<Form.Header>
				<Form.Title>{t('Confirmation')}</Form.Title>
				<Form.Subtitle>{t('registration.page.emailVerification.subTitle')}</Form.Subtitle>
			</Form.Header>
			<Form.Container>
				<FieldGroup disabled={sendEmail.isLoading || sendEmail.isSuccess}>
					<Field>
						<Field.Label htmlFor='email'>{t('Email')}*</Field.Label>
						<Field.Row>
							<TextInput
								{...register('email', {
									required: true,
								})}
								disabled={Boolean(email)}
								error={errors.email && t('onboarding.component.form.requiredField')}
								aria-invalid={errors?.email?.type === 'required'}
								placeholder={t1('Email_Placeholder')}
								id='email'
							/>
						</Field.Row>
						{errors.email && <Field.Error>{t('onboarding.component.form.requiredField')}</Field.Error>}
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
					<Button type='submit' primary>
						{t1('Send_confirmation_email')}
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

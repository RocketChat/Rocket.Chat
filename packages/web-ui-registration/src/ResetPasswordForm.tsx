import { FieldGroup, TextInput, Field, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useSendForgotPassword } from './hooks/useSendForgotPassword';

export const ResetPasswordForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const { t } = useTranslation();

	const [sent, setSent] = useState<boolean>(false);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<{
		email: string;
	}>();

	const resetPassword = useSendForgotPassword();

	return (
		<Form
			onSubmit={handleSubmit((data) => {
				resetPassword({ email: data.email });
				setSent(true);
			})}
		>
			<Form.Header>
				<Form.Title>{t('registration_component_resetPassword')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<Field.Label htmlFor='email'>{t('registration_component_form_email')}</Field.Label>
						<Field.Row>
							<TextInput
								{...register('email', {
									required: true,
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: t('registration_page_resetPassword_errors_invalidEmail'),
									},
								})}
								error={errors.email && (errors.email?.message || t('registration_component_form_requiredField'))}
								aria-invalid={Boolean(errors.email)}
								placeholder={t('registration_component_form_emailPlaceholder')}
								name='email'
								id='email'
							/>
						</Field.Row>
						{errors.email && <Field.Error>{errors.email.message || t('registration_component_form_requiredField')}</Field.Error>}
					</Field>
				</FieldGroup>
				{sent && (
					<FieldGroup>
						<Callout role='status' mbs='x24' icon='mail'>
							{t('registration_page_resetPassword_sent')}
						</Callout>
					</FieldGroup>
				)}
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' disabled={isSubmitting} primary>
						{t('registration_page_resetPassword_sendInstructions')}
					</Button>
				</ButtonGroup>

				<ActionLink
					onClick={(): void => {
						setLoginRoute('login');
					}}
				>
					{t('registration_page_register_back')}
				</ActionLink>
			</Form.Footer>
		</Form>
	);
};

export default ResetPasswordForm;
